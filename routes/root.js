require("dotenv").config()
const express = require("express")
const router = express.Router()
const { getQpCollection } = require("../utils/utils")
const Userlog = require("../schemas/userlog")

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

router.post("/getPdfUrl", async (req, res) => {
  const pdfName = req.body.pdfName
  const type = req.body.type

  if (!pdfName) {
    res.send({ error: true, info: "No pdf name provided" })
    return
  }

  const pdfObject = await getPdfObject()

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

  function getPdfObject() {
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

function validateEmail(input) {
  var validRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

  if (input.match(validRegex)) {
    return true
  } else {
    return false
  }
}

module.exports = router
