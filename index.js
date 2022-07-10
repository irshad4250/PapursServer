require("dotenv").config()
const express = require("express")
const app = express()
const { connectToMongo } = require("./utils/utils")

const port = process.env.PORT || 5000

app.use(express.urlencoded({ extended: true }))
app.use("/public", express.static("public"))
app.use(express.json())
app.set("view engine", "ejs")
app.engine("ejs", require("ejs").__express)

const rootRouter = require("./routes/root")
const searchRouter = require("./routes/search")

app.use("/", rootRouter)
app.use("/search", searchRouter)

app.get("*", (req, res) => {
  res.send("error 404 irs not found")
})

connectToMongo().then((successful) => {
  app.listen(port, () => {
    console.log("Listening on port " + port)
  })
})
