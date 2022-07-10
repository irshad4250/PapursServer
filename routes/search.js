const express = require("express")
const router = express.Router()
const { getQpCollection } = require("../utils/utils")

router.get("/", async (req, res) => {
  const q = req.query.q

  if (!q) {
    res.redirect("/")
    return
  }

  const results = await getResults(q)

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

      const splited = result.pdfname.split("_")

      let title =
        month + " " + result.yearInt.toString() + " P" + result.variant
      object.title = title

      const link =
        "https://papers.gceguide.com/A%20Levels/" +
        result.subject +
        "/" +
        result.yearInt +
        "/"

      const qpLink = link + result.pdfname
      const msLink = link + result.pdfname.replace("qp", "ms")

      object.qpLink = qpLink
      object.msLink = msLink
      return object
    })

    res.render("search", { q: q, results: finalResults, empty: false })
  } else {
    res.render("search", { q: q, results: [], empty: true })
  }
})

function getResults(searchText) {
  return new Promise(async (resolve, reject) => {
    const results = await getQpCollection()
      .aggregate([
        {
          $search: {
            index: "default",
            text: {
              query: searchText,
              path: "body",
              fuzzy: {
                maxEdits: 1,
                prefixLength: 4,
                maxExpansions: 1,
              },
            },
            // phrase: {
            //   query: searchText,
            //   path: "body",
            //   slop: 2,
            // },
          },
        },
        {
          $project: {
            pdfname: 1,
            year: 1,
            yearInt: 1,
            subject: 1,
            variant: 1,
          },
        },
        { $limit: 10 },
        // { $sort: { yearInt: -1 } },
      ])
      .toArray()
    resolve(results)
  })
}

module.exports = router
