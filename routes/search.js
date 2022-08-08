require("dotenv").config()
const express = require("express")
const router = express.Router()
const { getQpCollection } = require("../utils/utils")
const Search = require("../schemas/searches")

router.post("/", async (req, res) => {
  const q = req.body.q.toLowerCase().replace(/[^a-z0-9 ]/gi, "")
  const cookieId = req.body.cookieId

  const year = req.body.year
  const subject = req.body.subject
  const examLevel = req.body.exam

  if (!q) {
    res.send({ error: true, info: "No query provided." })
    return
  }

  if (process.env.NODE_ENV == "production") {
    const search = new Search({ query: q, cookieId: cookieId })
    search.save()
  }
  const results = await getResultsV3(q, examLevel, subject, year)

  if (results.length == 0) {
    res.send({
      error: false,
      q: q,
      results: [],
      subject: subject,
      exam: examLevel,
      year: year,
    })
    return
  }

  const finalResults = []

  results.forEach((result) => {
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

    const body = result.body.toLowerCase().replace(/[^a-z0-9 ]/gi, "")

    const textIndex = body.indexOf(q)
    let resultText

    if (textIndex !== -1) {
      let textLastIndex = textIndex + 220
      if (textLastIndex > body.length - 1) {
        textLastIndex = body.length - 1
      }
      resultText = body.substring(textIndex, textLastIndex) + "..."
    } else {
      resultText = ""
    }

    object.resultText = resultText
    object.qpLink = qpLink
    object.msLink = msLink
    object.rawQpLink = rawQpLink
    object.rawMsLink = rawMsLink

    let pattern = new RegExp(q, "i")

    if (body.match(pattern)) {
      finalResults.unshift(object)
    } else {
      finalResults.push(object)
    }
  })

  res.send({
    error: false,
    q: req.body.q,
    results: finalResults,
    subject: subject,
    exam: examLevel,
    year: year,
  })
})

router.post("/autocomplete", async (req, res, next) => {
  const q = req.body.q.toLowerCase().replace(/[^a-z0-9 ]/gi, "")

  if (!q) {
    res.send({ error: true })
    return
  }

  const results = await getResultsV3(q)

  if (results.length == 0) {
    res.send([])
    return
  }

  let autocomplete = []
  results.forEach((result) => {
    let body = result.body.toLowerCase().replace(/[^a-z0-9 ]/gi, "")

    const firstIndex = body.indexOf(q)
    let lastIndex = firstIndex + 100

    if (lastIndex >= body.length) {
      lastIndex = body.length - 1
    }

    let spaceIndex = lastIndex

    if (firstIndex == -1) {
      return
    }

    for (let i = lastIndex; i > firstIndex; i--) {
      const letter = body[i]
      if (letter == " ") {
        spaceIndex = i
        break
      }
    }

    const text = body.substring(firstIndex, spaceIndex)

    let pattern = new RegExp(q, "i")

    if (body.match(pattern)) {
      autocomplete.unshift(text)
    } else {
      autocomplete.push(text)
    }
  })

  res.send(autocomplete)
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
        index: "auto2",
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
            {
              autocomplete: {
                query: searchText,
                path: "body",
                tokenOrder: "sequential",
                score: { boost: { value: 10 } },
              },
            },
            {
              phrase: {
                query: searchText,
                path: "body",
                score: { boost: { value: 20 } },
                slop: 0,
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
