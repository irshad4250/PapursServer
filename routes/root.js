const express = require("express")
const router = express.Router()
const { getQpCollection } = require("../utils/utils")

router.get("/", async (req, res) => {
  res.render("home")
})

router.get("/home", (req, res) => {
  res.redirect("/")
})

module.exports = router
