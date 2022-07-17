const express = require("express")
const router = express.Router()
const {
  OLevelSubjects,
  ALevelSubjects,
  getQpCollection,
} = require("../utils/utils")

router.post("/getSubjectsLevel", (req, res) => {
  const level = req.body.level
  if (!level) {
    res.send({ error: true, info: "Exam level is required" })
    return
  }

  let toReturn

  if (level == "O") {
    toReturn = OLevelSubjects
  } else if (level == "A") {
    toReturn = ALevelSubjects
  }

  res.send({ error: false, data: toReturn })
})

router.post("/getYears", async (req, res) => {
  const subject = req.body.subject
  if (!subject) {
    res.send({ error: true, info: "Subject is required" })
    return
  }

  const years = await getYearArr(subject)

  res.send({ error: false, data: years })

  function getYearArr() {
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
})

module.exports = router
