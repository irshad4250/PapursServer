const express = require("express")
const router = express.Router()
const { getQpCollection } = require("../utils/utils")

router.get("/", async (req, res) => {
  res.render("home")
})

router.get("/home", (req, res) => {
  res.redirect("/")
})

router.get("/news", (req, res) => {
  res.render("news")
})

module.exports = router
