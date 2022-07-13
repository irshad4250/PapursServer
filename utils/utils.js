require("dotenv").config()

const { MongoClient } = require("mongodb")
const mongoose = require("mongoose")
const client = new MongoClient(process.env.MONGODB_URI)

let qpCollection

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

module.exports = { connectToMongo, getQpCollection }
