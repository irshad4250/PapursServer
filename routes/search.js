require("dotenv").config()
const express = require("express")
const router = express.Router()
const { getQpCollection } = require("../utils/utils")
const Search = require("../schemas/searches")

router.get("/", async (req, res) => {
  const q = req.query.q

  const year = req.query.year
  const subject = req.query.subject
  const examLevel = req.query.exam

  if (!q) {
    res.redirect("/")
    return
  }

  if (process.env.NODE_ENV == "production") {
    const search = new Search({ query: q, cookieId: req.cookies.pid })
    search.save()
  }
  const results = await getResultsV3(q, examLevel, subject, year)

  if (results.length != 0) {
    const finalResults = results.map((result) => {
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

      let title =
        month + " " + result.yearInt.toString() + " P" + result.variant
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

      const textIndex = result.body
        .toLowerCase()
        .indexOf(q.toLowerCase().replaceAll(".", ""))
      let resultText

      if (textIndex !== -1) {
        let textLastIndex
        textLastIndex = textIndex + 220
        if (textLastIndex > result.body.length) {
          textLastIndex = result.body.length
        }
        resultText = result.body.substring(textIndex, textLastIndex) + "..."
      } else {
        resultText = ""
      }

      object.resultText = resultText
      object.qpLink = qpLink
      object.msLink = msLink
      object.rawQpLink = rawQpLink
      object.rawMsLink = rawMsLink

      return object
    })

    res.render("search", {
      q: q,
      results: finalResults,
      subject: subject,
      exam: examLevel,
      year: year,
      empty: false,
    })
  } else {
    res.render("search", {
      q: q,
      results: [],
      subject: subject,
      exam: examLevel,
      year: year,
      empty: true,
    })
  }
})

function getYearJson(year) {
  return { $match: { yearInt: { $eq: parseInt(year) } } }
}

function getSubjectJson(subject) {
  return { $match: { subject: subject } }
}

function getExamJson(examLevel) {
  return { $match: { grade: examLevel } }
}

function getSearchJsonArr(searchText) {
  return [
    {
      $search: {
        index: "autocomplete",
        compound: {
          must: [
            {
              text: {
                query: searchText,
                path: "body",
                fuzzy: {
                  maxEdits: 1,
                  prefixLength: 4,
                  maxExpansions: 1,
                },
              },
            },
          ],
          should: [
            {
              autocomplete: {
                query: searchText,
                path: "body",
                score: { boost: { value: 5 } },
              },
            },
          ],
          should: [
            {
              autocomplete: {
                query: searchText,
                path: "body",
                tokenOrder: "sequential",
                score: { boost: { value: 10 } },
              },
            },
          ],
        },
      },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        pdfname: 1,
        year: 1,
        yearInt: 1,
        subject: 1,
        variant: 1,
        grade: 1,
        body: 1,
      },
    },
  ]
}

function getResultsV3(searchText, examLevel, subject, year) {
  const search = getSearchJsonArr(searchText)

  if (examLevel) {
    search.push(getExamJson(examLevel))
  }

  if (subject) {
    search.push(getSubjectJson(subject))
  }

  if (year) {
    search.push(getYearJson(year))
  }

  return new Promise(async (resolve, reject) => {
    const results = await getQpCollection().aggregate(search).toArray()
    resolve(results)
  })
}

module.exports = router
