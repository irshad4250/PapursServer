const mongoose = require("mongoose")
const Schema = mongoose.Schema

const searchesSchema = new Schema(
  {
    query: {
      type: String,
      required: true,
    },
    cookieId: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
)

const Search = mongoose.model("Searches", searchesSchema)
module.exports = Search
