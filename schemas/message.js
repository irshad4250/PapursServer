const mongoose = require("mongoose")
const Schema = mongoose.Schema

const messageSchema = new Schema(
  {
    body: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

const Message = mongoose.model("Messages", messageSchema)
module.exports = Message
