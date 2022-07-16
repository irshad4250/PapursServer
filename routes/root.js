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

router.get("/node", (req, res) => {
  res.send(process.env.NODE_ENV || "development")
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
