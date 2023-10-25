require("dotenv").config()
const express = require("express")
const router = express.Router()
const { getQpCollection, makeId } = require("../utils/utils")
const Userlog = require("../schemas/userlog")
const axios = require("axios")
const https = require("https")
const fs = require("fs")
const path = require("path")
const fontkit = require("@pdf-lib/fontkit")
const { PDFDocument, rgb } = require("pdf-lib")

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

router.get("/getPdf", async (req, res) => {
  const pdfName = req.query.pdfName
  const type = req.query.type

  if (!pdfName) {
    res.send({ error: true, info: "No pdf found" })
    return
  }

  if (type && type != "ms") {
    res.send({ error: true, info: "Pdf type invalid" })
    return
  }

  const url = await getPdfUrl(pdfName, type)

  if (!url) {
    res.send({ error: true, info: "Could not find pdf." })
    return
  }

  const pdfData = await getPdfData(url)
  if (!pdfData) {
    res.send({ error: true, info: "Could not download pdf." })
    return
  }

  const pdfPath = __dirname + "/pdfs/" + makeId(7) + ".pdf"
  const saved = await savePdfFileLocal(pdfData, pdfPath)

  if (!saved) {
    res.send({ error: true, info: "Could not save pdf." })

    setTimeout(() => {
      try {
        fs.unlinkSync(pdfPath)
      } catch {}
    }, 5000)

    return
  }

  await addWaterMarkToPdf(pdfPath)
  res.sendFile(pdfPath)

  setTimeout(() => {
    try {
      fs.unlinkSync(pdfPath)
    } catch {}
  }, 5000)

  /**
   * Returns true if saved, returns false otherwise
   */
  function savePdfFileLocal(data, pdfPath) {
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(pdfPath)
      let error = null
      data.pipe(writer)
      writer.on("error", (err) => {
        error = err
        writer.close()
        resolve(false)
      })
      writer.on("close", async () => {
        if (!error) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  function getPdfData(url) {
    return new Promise((resolve, reject) => {
      const agent = new https.Agent({
        rejectUnauthorized: false,
      })
      axios
        .get(url, {
          httpsAgent: agent,
          responseType: "stream",
        })
        .then((response) => {
          resolve(response.data)
        })
        .catch((e) => {
          resolve()
        })
    })
  }

  function addWaterMarkToPdf(pdfPath) {
    return new Promise(async (resolve, reject) => {
      const fontBytes = fs.readFileSync(path.join(__dirname, "font.ttf"))
      const pdfData = fs.readFileSync(pdfPath)
      const pdf = await PDFDocument.load(pdfData)

      pdf.registerFontkit(fontkit)
      const watermarkFont = await pdf.embedFont(fontBytes)

      pdf.setTitle(
        (type ? pdfName.replace("qp", "ms") : pdfName) + " | papurs.com"
      )
      pdf.setAuthor("Papurs.com")
      const pages = pdf.getPages()
      pages.forEach((page) => {
        page.moveTo(10, 10)
        page.drawText("www.papurs.com", {
          size: 12,
          font: watermarkFont,
          color: rgb(109 / 255, 40 / 255, 217 / 255),
        })
      })

      const pdfBytes = await pdf.save()
      fs.writeFileSync(pdfPath, pdfBytes)
      resolve()
    })
  }
})

router.get("/getTemplate", async (req, res) => {
  res.sendFile(__dirname + "/template.pdf")
})

router.post("/getUrlForPastPapers", async (req, res) => {
  let { subject, startYear, endYear, variants } = req.body

  if (variants && variants.length != 0) {
    variants = variants.map((variant) => variant.toString())
  } else {
    variants = []
  }

  if (!subject || !startYear || !endYear) {
    res.send({ error: true, info: "Missing values" })
    return
  }

  try {
    startYear = parseInt(startYear)
    endYear = parseInt(endYear)
  } catch {
    res.send({
      error: true,
      info: "Some values are wrong please check and try again",
    })
    return
  }

  const papers = await getPapersForGenerator(
    subject,
    startYear,
    endYear,
    variants
  )

  if (!papers || papers.length == 0) {
    res.send({
      error: true,
      info: "There is no past papers available for these input.",
    })
    return
  }
  const filteredPapers = returnUrlArray(papers)

  res.send(filteredPapers)

  function returnUrlArray(papers) {
    return papers.map((paper) => {
      const final = {}
      final.downloadUrl = `https://server.papurs.com/getPdf?pdfName=${paper.pdfname}`
      // final.downloadUrl = `http://192.168.100.140:5000/getPdf?pdfName=${paper.pdfname}`
      final.subject = paper.subject
      final.yearInt = paper.yearInt
      final.variant = paper.variant
      final.month = getMonth(paper.year[0])
      final.title = final.month + " " + final.yearInt + " P" + final.variant

      return final
    })
  }

  function getMonth(suffix) {
    if (suffix == "m") {
      return "March"
    } else if (suffix == "w") {
      return "November"
    } else {
      return "June"
    }
  }
})

function getPapersForGenerator(subject, startYear, endYear, variants) {
  const queryObject = {
    subject: { $eq: subject },
    yearInt: { $gte: parseInt(startYear), $lte: parseInt(endYear) },
  }

  if (variants.length != 0) {
    queryObject.variant = { $in: variants }
  }

  return new Promise((resolve, reject) => {
    getQpCollection()
      .find(queryObject)
      .project({ body: 0 })
      .sort({ yearInt: 1 })
      .toArray((err, result) => {
        if (err) {
          resolve(null)
        } else {
          resolve(result)
        }
      })
  })
}

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

  let pdfLink

  pdfLink = `https://papers.gceguide.com/${grade} Levels/${pdf.subject}/${
    pdf.yearInt
  }/${type == "ms" ? pdf.pdfname.replace("qp", "ms") : pdf.pdfname}`

  let tempType = type != undefined ? type : "qp"
  if (pdf[tempType + "Link"]) {
    pdfLink = pdf[tempType + "Link"]
  }

  return pdfLink
}

module.exports = router
