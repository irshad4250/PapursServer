require("dotenv").config()

const { MongoClient } = require("mongodb")
const mongoose = require("mongoose")
const client = new MongoClient(process.env.MONGODB_URI)

const Userlog = require("../schemas/userlog")

let qpCollection

const ALevelSubjects = [
  "Chemistry (9701)",
  "Computer Science (for final examination in 2021) (9608)",
  "General Paper 8004 (AS Level only) (8004)",
  "Design and Technology (9705)",
  "Mathematics (9709)",
  "Physics (9702)",
  "English General Paper (AS Level only) (8021)",
]
const OLevelSubjects = [
  "Economics (2281)",
  "Chemistry (5070)",
  "Computer Science (2210)",
  "Design and Technology (6043)",
  "Mathematics - Additional (4037)",
  "Physics (5054)",
  "Mathematics D (4024)",
  "English (1123)",
]

ALevelSubjects.sort()
OLevelSubjects.sort()
/**
 * Attribute for making requests to mongodb.
 */
function getQpCollection() {
  return qpCollection
}

/**
 * @returns true if connected otherwise false.
 */
function connectToMongo() {
  return new Promise(async (resolve, reject) => {
    try {
      mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })

      await client.connect()
      qpCollection = client.db("papurs").collection("qp")
      resolve(true)
    } catch (e) {
      resolve(false)
    }
  })
}

function cookieMiddleware(req, res, next) {
  let pid = req.cookies.pid

  if (req.path == "/favicon.ico") {
    return
  }

  if (!req.session.old) {
    if (!pid) {
      pid = makeId(30)
      res.cookie("pid", pid, {
        maxAge: 2 * 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      })
    }

    const userlog = new Userlog({
      cookieId: pid,
      source: req.query.src == "sm" ? "Social Media" : null,
    })
    userlog.save()
    req.session.old = true
  }

  next()
}

function makeId(length) {
  var result = ""
  var characters = "abcdefghijklmnopqrstuvwxyz0123456789"
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

module.exports = {
  connectToMongo,
  getQpCollection,
  cookieMiddleware,
  ALevelSubjects,
  OLevelSubjects,
}
