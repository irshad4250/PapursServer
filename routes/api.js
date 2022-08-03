const express = require("express")
const router = express.Router()
const { getQpCollection } = require("../utils/utils")

router.post("/getSubjectsLevel", async (req, res) => {
  const level = req.body.level
  if (!level) {
    res.send({ error: true, info: "Exam level is required" })
    return
  }

  if (level != "O" && level != "A") {
    res.send({ error: true, info: "Exam level is in wrong format" })
    return
  }

  const subjects = await getSubjects(level)
  subjects.sort()

  res.send({ error: false, data: subjects })
})

router.post("/getYears", async (req, res) => {
  const subject = req.body.subject
  if (!subject) {
    res.send({ error: true, info: "Subject is required" })
    return
  }

  const years = await getYearArr(subject)

  res.send({ error: false, data: years })
})

function getSubjects(grade) {
  return new Promise((resolve, reject) => {
    getQpCollection()
      .distinct("subject", { grade: grade })
      .then((r) => {
        resolve(r)
      })
      .catch((err) => {
        resolve([])
      })
  })
}

function getYearArr(subject) {
  return new Promise((resolve, reject) => {
    getQpCollection()
      .distinct("yearInt", { subject: subject })
      .then((r) => {
        resolve(r)
      })
      .catch((err) => {
        resolve([])
      })
  })
}

module.exports = router
