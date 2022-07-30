require("dotenv").config()
const express = require("express")
const app = express()
const cors = require("cors")
const cookieParser = require("cookie-parser")
const { connectToMongo } = require("./utils/utils")

const port = process.env.PORT || 5000

app.use(
  cors([
    { origin: "http://localhost:3000" },
    { origin: "http://www.papurs.com" },
    { origin: "http://papurs.com" },
    { origin: "https://www.papurs.com" },
    { origin: "https://papurs.com" },
  ])
)
app.use(express.urlencoded({ extended: true }))
app.use("/public", express.static("public"))
app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())

const rootRouter = require("./routes/root")
const searchRouter = require("./routes/search")
const apiRouter = require("./routes/api")

app.use("/", rootRouter)
app.use("/search", searchRouter)
app.use("/api", apiRouter)

app.get("*", (req, res) => {
  res.status(404).send("404")
})

connectToMongo().then((successful) => {
  app.listen(port, () => {
    console.log("Listening on port " + port)
  })
})
