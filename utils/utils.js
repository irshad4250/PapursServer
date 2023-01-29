require("dotenv").config()

const { MongoClient } = require("mongodb")
const mongoose = require("mongoose")
const client = new MongoClient(process.env.MONGODB_URI)

const Userlog = require("../schemas/userlog")

let qpCollection
let instantAnswerCollection

/**
 * Attribute for making requests to mongodb.
 */
function getQpCollection() {
  return qpCollection
}

function getInstantAnswerCollection() {
  return instantAnswerCollection
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
      instantAnswerCollection = client.db("papurs").collection("instantAnswer")
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
  getInstantAnswerCollection,
  cookieMiddleware,
  makeId,
}
