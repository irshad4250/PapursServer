const mongoose = require("mongoose")
const Schema = mongoose.Schema

const GiveawayEntrySchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

const GiveawayEntry = mongoose.model("GiveawayEntry", GiveawayEntrySchema)
module.exports = GiveawayEntry
