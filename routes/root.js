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
