require("dotenv").config()
const express = require("express")
const router = express.Router()
const { getQpCollection } = require("../utils/utils")

const Message = require("../schemas/message")

router.get("/", async (req, res) => {
  res.render("home")
})

router.get("/home", (req, res) => {
  res.redirect("/")
})

router.get("/news", (req, res) => {
  res.render("news")
})

router.get("/pastPapers", (req, res) => {
  res.render("pastPapers")
})

router.get("/pastPapers/papers", async (req, res) => {
  const { subject, year } = req.query

  if (!subject || !year) {
  }

  const papers = await getPapers(subject, year)
  if (papers.length === 0) {
    res.render("404")
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

    const qpLink = "/view/" + result.pdfname
    const msLink = "/view/" + result.pdfname + "?type=ms"

    const rawQpLink = link + result.pdfname
    const rawMsLink = link + result.pdfname.replace("qp", "ms")

    object.qpLink = qpLink
    object.msLink = msLink
    object.rawQpLink = rawQpLink
    object.rawMsLink = rawMsLink

    return object
  })

  res.render("papers", { results: finalResults, subject: subject, year: year })

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

router.get("/about", (req, res) => {
  res.render("about")
})

router.get("/view/:pdfName", async (req, res) => {
  const pdfName = req.params.pdfName
  const type = req.query.type

  const pdfObject = await getPdfObject()

  if (!pdfObject || pdfObject.length === 0) {
    res.status(404).render("404")
    return
  }

  const pdf = pdfObject[0]
  const grade = pdf.grade ? pdf.grade : "A"
  const pdfLink = `https://papers.gceguide.com/${grade} Levels/${pdf.subject}/${
    pdf.yearInt
  }/${type == "ms" ? pdf.pdfname.replace("qp", "ms") : pdf.pdfname}`

  res.render("viewpdf", { pdfUrl: pdfLink })

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

function validateEmail(input) {
  var validRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

  if (input.match(validRegex)) {
    return true
  } else {
    return false
  }
}

router.get("/contact", (req, res) => {
  res.render("contact")
})

module.exports = router
