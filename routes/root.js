require("dotenv").config()
const express = require("express")
const router = express.Router()
const { getQpCollection, makeId } = require("../utils/utils")
const Userlog = require("../schemas/userlog")
const axios = require("axios")
const https = require("https")
const fs = require("fs")

const Message = require("../schemas/message")

router.post("/getPapers", async (req, res) => {
  const { subject, year } = req.body

  if (!subject || !year) {
    res.send({ error: true })
    return
  }

  const papers = await getPapers(subject, year)
  if (papers.length === 0) {
    res.send({ error: true })
    return
  }

  const finalResults = papers.map((result) => {
    let object = {}
    object.subject = result.subject

    let month
    let prefix = result.year.slice(0, 1)

    if (prefix == "m") {
      month = "March"
    } else if (prefix == "s") {
      month = "June"
    } else if (prefix == "w") {
      month = "Nov"
    }

    let title = month + " " + result.yearInt.toString() + " P" + result.variant
    object.title = title

    const link =
      "https://papers.gceguide.com/A%20Levels/" +
      result.subject +
      "/" +
      result.yearInt +
      "/"

    const qpLink = "/ViewPdf?name=" + result.pdfname
    const msLink = "/ViewPdf?name=" + result.pdfname + "&type=ms"

    const rawQpLink = link + result.pdfname
    const rawMsLink = link + result.pdfname.replace("qp", "ms")

    object.qpLink = qpLink
    object.msLink = msLink
    object.rawQpLink = rawQpLink
    object.rawMsLink = rawMsLink

    return object
  })

  res.send(finalResults)

  function getPapers(subject, year) {
    return new Promise(async (resolve, reject) => {
      const results = await getQpCollection()
        .find(
          {
            $and: [{ subject: subject }, { yearInt: parseInt(year) }],
          },
          {
            projection: {
              subject: 1,
              yearInt: 1,
              year: 1,
              variant: 1,
              pdfname: 1,
            },
          }
        )
        .sort({ variant: 1 })
        .toArray()

      resolve(results)
    })
  }
})

router.get("/getPdfUrl", async (req, res) => {
  const pdfName = req.query.pdfName
  const type = req.query.type

  if (!pdfName) {
    res.send({ error: true, info: "No pdf name provided" })
    return
  }

  const pdfObject = await getPdfObject(pdfName)

  if (!pdfObject || pdfObject.length === 0) {
    res.send({ error: true, info: "No pdf found" })
    return
  }

  const pdf = pdfObject[0]
  const grade = pdf.grade
  const pdfLink = `https://papers.gceguide.com/${grade} Levels/${pdf.subject}/${
    pdf.yearInt
  }/${type == "ms" ? pdf.pdfname.replace("qp", "ms") : pdf.pdfname}`

  res.send(pdfLink)
})

router.post("/contact", async (req, res) => {
  const email = req.body.email
  const message = req.body.message

  if (!email || !message) {
    res.send({ error: true, info: "Missing values!" })
    return
  }

  if (!validateEmail(email)) {
    res.send({ error: true, info: "Email in wrong format!" })
    return
  }

  const messageDb = new Message({ body: message, email: email })

  messageDb
    .save()
    .then(() => {
      res.send({ error: false })
    })
    .catch(() => {
      res.send({
        error: true,
        info: "Server error please send message again!",
      })
    })
})

router.post("/registerLog", (req, res) => {
  const cookieId = req.body.cookieId
  const source = req.body.source

  if (!cookieId) {
    res.send({})
    return
  }
  const userlog = new Userlog({
    cookieId: cookieId,
    source: source,
  })

  checkIfExists(cookieId).then((exists) => {
    if (!exists && process.env.NODE_ENV == "production") {
      userlog
        .save()
        .then((e) => {})
        .catch((e) => {})
    }
  })

  function checkIfExists(cookiedId) {
    return new Promise((resolve, reject) => {
      Userlog.findOne({ cookieId: { $eq: "lamo" } }, (err, result) => {
        if (err) {
          resolve(false)
          return
        }

        if (result) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  res.send({})
})

// router.get("/getPdf", async (req, res) => {
//   const pdfName = req.query.pdfName
//   const type = req.query.type

//   if (!pdfName) {
//     res.send({ error: true, info: "No pdf found" })
//     return
//   }

//   if (type && type != "ms") {
//     res.send({ error: true, info: "Pdf type invalid" })
//     return
//   }

//   const url = await getPdfUrl(pdfName, type)

//   if (!url) {
//     res.send({ error: true, info: "Could not find pdf." })
//     return
//   }

//   const agent = new https.Agent({
//     rejectUnauthorized: false,
//   })

//   const pdfPath = "/pdfs/" + makeId(7) + ".pdf"

//   const writer = fs.createWriteStream(__dirname + pdfPath)

//   axios
//     .get(url, { httpsAgent: agent, responseType: "stream" })
//     .then((response) => {
//       return new Promise((resolve, reject) => {
//         response.data.pipe(writer)
//         let error = null
//         writer.on("error", (err) => {
//           error = err
//           writer.close()
//           res.send({ error: true, info: "Could not download pdf." })
//           reject(err)
//         })
//         writer.on("close", async () => {
//           if (!error) {
//             res.sendFile(__dirname + pdfPath)
//             resolve(true)
//             try {
//               setTimeout(() => {
//                 fs.unlinkSync(__dirname + pdfPath)
//               }, 5000)
//             } catch (err) {}
//           }
//         })
//       })
//     })
// })

function validateEmail(input) {
  var validRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

  if (input.match(validRegex)) {
    return true
  } else {
    return false
  }
}

function getPdfObject(pdfName) {
  return new Promise((resolve, reject) => {
    getQpCollection()
      .find({ pdfname: { $eq: pdfName } })
      .project({ body: 0 })
      .toArray((err, result) => {
        if (err) {
          resolve(null)
        } else {
          resolve(result)
        }
      })
  })
}

async function getPdfUrl(pdfName, type) {
  const pdfObject = await getPdfObject(pdfName)
  if (!pdfObject || pdfObject.length === 0) {
    return
  }

  const pdf = pdfObject[0]
  const grade = pdf.grade
  const pdfLink = `https://papers.gceguide.com/${grade} Levels/${pdf.subject}/${
    pdf.yearInt
  }/${type == "ms" ? pdf.pdfname.replace("qp", "ms") : pdf.pdfname}`

  return pdfLink
}

module.exports = router
