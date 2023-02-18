require("dotenv").config()
const express = require("express")
const router = express.Router()
const {
  getQpCollection,
  getInstantAnswerCollection,
} = require("../utils/utils")
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
  const instantAnsResults = await getInstantAnswer(q)

  let pdfNames
  try {
    pdfNames = instantAnsResults.map((instantAns) => {
      return instantAns.pdfname
    })
  } catch (error) {
    pdfNames = []
  }

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

  let finalResults = []

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

    object.resultText = getMatchingText(q, body)
    try {
      object.resultText = getMatchingText(
        returnPartialText(q, body).finalText,
        body
      )
    } catch (e) {}

    object.qpLink = qpLink
    object.msLink = msLink
    object.rawQpLink = rawQpLink
    object.rawMsLink = rawMsLink

    if (pdfNames.includes(result.pdfname)) {
      object.instantAns = instantAnsResults[pdfNames.indexOf(result.pdfname)]
      object.instantAns.question = object.instantAns.question.replaceAll(
        /[.]{2,}/g,
        ""
      )
      object.instantAns.answer = object.instantAns.answer.replaceAll(
        /[.]{2,}/g,
        ""
      )
    }

    let pattern = new RegExp(q, "i")

    if (body.match(pattern)) {
      finalResults.unshift(object)
    } else {
      finalResults.push(object)
    }
  })

  const noBodyArr = []
  const bodyArr = []

  for (let i = 0; i < finalResults.length; i++) {
    const body = finalResults[i].resultText
    if (!body || body == " ") {
      noBodyArr.push(finalResults[i])
    } else {
      bodyArr.push(finalResults[i])
    }
  }

  finalResults = [...bodyArr, ...noBodyArr]

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
  let q = req.body.q

  if (!q) {
    res.send({ error: true })
    return
  }

  q = q.toLowerCase().replace(/[^a-z0-9 ]/gi, "")

  if (q.trim().split(" ").length <= 2) {
    res.send([])
    return
  }

  const results = await getResultsV3(q, null, null, null, 7)

  if (results.length == 0) {
    res.send([])
    return
  }

  let autocomplete = []
  results.forEach((result) => {
    let body = result.body.toLowerCase().replace(/[^a-z0-9 ]/gi, "")
    let text = ""

    try {
      text = returnPartialText(q, body).finalText
    } catch (error) {}

    if (text) {
      autocomplete.push(text)
    }
  })

  const noOfMatchingArr = []

  autocomplete.forEach((auto) => {
    noOfMatchingArr.push({
      autocompleteText: auto,
      noOfMatches: getNumberOfMatchingLetters(auto, q),
    })
  })

  let greatestMatching = 1000

  const finalAutocomplete = []

  noOfMatchingArr.forEach((matchingArr) => {
    if (!matchingArr.autocompleteText || matchingArr.autocompleteText == " ") {
      return
    }
    if (matchingArr.noOfMatches <= greatestMatching) {
      finalAutocomplete.push(matchingArr.autocompleteText)
    } else {
      finalAutocomplete.unshift(matchingArr.autocompleteText)
      greatestMatching = noOfMatchingArr.noOfMatches
    }
  })

  res.send(finalAutocomplete)
})

function returnPartialText(text, paragraph) {
  const MAX_NULLS = 4

  // converting string into word array
  const paragraphArr = paragraph.toLowerCase().split(" ")
  const textArr = text.toLowerCase().split(" ")

  //getting all indexes of each word in paragraph.
  //example of results [40,250,466]
  //is a 2D Array
  const wordsIndexesArr = textArr.map((wordText) => {
    return returnAllIndexesOf(wordText, paragraphArr)
  })

  //For each first word in arr is where we start
  const firstArr = wordsIndexesArr[0]

  //Will contains all indexes of words in a sequence a 2d array
  const sequencedArray = []

  for (let i = 0; i < firstArr.length; i++) {
    let currentIndex = firstArr[i]

    const finalArr = []
    finalArr.push(currentIndex)

    for (let k = 1; k < wordsIndexesArr.length; k++) {
      const nextArr = wordsIndexesArr[k]

      if (nextArr.includes(currentIndex + 1)) {
        finalArr.push(currentIndex + 1)
      } else {
        finalArr.push(null)
      }
      currentIndex += 1
    }

    sequencedArray.push(finalArr)
  }

  //the indexes that we will get autocomplete from
  let finalSequence = []

  //Gets the sequence that has the least number of nulls
  for (let i = 0; i < sequencedArray.length; i++) {
    const array = sequencedArray[i]

    const noOfNulls = getNoOfNulls(array)

    if (finalSequence.length == 0) {
      finalSequence = array
    }

    if (noOfNulls < getNoOfNulls(finalSequence)) {
      finalSequence = array
    }
  }

  // returns nothing if null us greater than 4
  if (getNoOfNulls(finalSequence) > MAX_NULLS) {
    return
  }

  //adding text to sequence
  let lastIndex = -1
  for (let i = 0; i < finalSequence.length; i++) {
    const index = finalSequence[i]

    if (lastIndex != -1 && index == null) {
      lastIndex = lastIndex + 1
      finalSequence[i] = lastIndex
    }

    lastIndex = index
  }

  let lastWordIndex = finalSequence[finalSequence.length - 1] + 12
  if (lastWordIndex >= paragraphArr.length) {
    lastWordIndex = paragraphArr.length - 1
  }

  let finalText = ""
  let sequenceText = " "
  let addedText = " "
  for (
    let i = finalSequence[finalSequence.length - 1] + 1;
    i < lastWordIndex + 1;
    i++
  ) {
    addedText += paragraphArr[i] + " "
  }
  finalSequence.forEach((seqIndex) => {
    sequenceText += paragraphArr[seqIndex] + " "
  })

  finalText = sequenceText.trimEnd() + addedText

  return { sequenceText: sequenceText.trim(), addedText, finalText }

  function returnAllIndexesOf(wordText, wordsArr) {
    let indexToStart = 0
    const indexes = []

    do {
      const index = wordsArr.indexOf(wordText, indexToStart)
      if (index != -1) {
        indexes.push(index)
      }
      indexToStart = index + 1
    } while (indexToStart != 0)
    return indexes
  }

  function getNoOfNulls(Array) {
    let no = 0

    Array.forEach((index) => {
      if (index == null) {
        no++
      }
    })
    return no
  }
}

function getNumberOfMatchingLetters(partialText, qText) {
  let qTextArr = qText.split(" ")
  let partialTextArr = partialText.split(" ")

  let noOfMatching = 0

  partialTextArr.forEach((partialText) => {
    if (qTextArr.includes(partialText)) {
      noOfMatching++
    }
  })

  return noOfMatching
}

function getYearJson(year) {
  return { $match: { yearInt: { $eq: parseInt(year) } } }
}

function getSubjectJson(subject) {
  return { $match: { subject: subject } }
}

function getExamJson(examLevel) {
  return { $match: { grade: examLevel } }
}

function getSearchJsonArr(searchText, limit = 10) {
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
      $limit: limit,
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

function getResultsV3(searchText, examLevel, subject, year, limit = 10) {
  const search = getSearchJsonArr(searchText, limit)

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

function getInstantAnswer(searchText) {
  return new Promise(async (resolve, reject) => {
    const search = instantAnsJSON(searchText)
    const results = await getInstantAnswerCollection()
      .aggregate(search)
      .toArray()
    resolve(results)
  })

  function instantAnsJSON(searchText) {
    return [
      {
        $search: {
          index: "default",
          compound: {
            must: [
              {
                text: {
                  query: searchText,
                  path: "question",
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
                  path: "question",
                  score: { boost: { value: 5 } },
                },
              },
              {
                autocomplete: {
                  query: searchText,
                  path: "question",
                  tokenOrder: "sequential",
                  score: { boost: { value: 10 } },
                },
              },
              {
                phrase: {
                  query: searchText,
                  path: "question",
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
    ]
  }
}

function getMatchingText(textSnip, text) {
  const textIndex = text.indexOf(textSnip)
  let resultText

  if (textIndex !== -1) {
    let textLastIndex = textIndex + 220
    if (textLastIndex > text.length - 1) {
      textLastIndex = text.length - 1
    }
    resultText = text.substring(textIndex, textLastIndex) + "..."

    for (let i = resultText.length; i > 0; i--) {
      const letter = resultText[i]
      if (letter == " ") {
        resultText = resultText.substring(0, i)
        break
      }
    }
    return resultText
  }

  return ""
}

module.exports = router
