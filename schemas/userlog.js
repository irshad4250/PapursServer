const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userlogSchema = new Schema(
  {
    cookieId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

const Userlog = mongoose.model("Userlogs", userlogSchema)
module.exports = Userlog
