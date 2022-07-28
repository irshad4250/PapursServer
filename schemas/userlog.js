const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userlogSchema = new Schema(
  {
    cookieId: {
      type: String,
      required: false,
      unique: true,
    },
    source: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
)

const Userlog = mongoose.model("Userlogs", userlogSchema)
module.exports = Userlog
