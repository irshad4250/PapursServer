require("dotenv").config()
const express = require("express")
const app = express()
const cors = require("cors")
const cookieParser = require("cookie-parser")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const { connectToMongo, cookieMiddleware } = require("./utils/utils")

const port = process.env.PORT || 5000

app.use(
  cors([
    { origin: "http://localhost:3000" },
    { origin: "http://www.papurs.com" },
    { origin: "http://papurs.com" },
  ])
)
app.use(express.urlencoded({ extended: true }))
app.use("/public", express.static("public"))
app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())

if (process.env.NODE_ENV == "production") {
  app.use(
    session({
      secret: "lmaolmao",
      resave: false,
      saveUninitialized: true,
      cookie: { httpOnly: true, maxAge: 60 * 60 * 1000 },
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        autoRemove: "interval",
        autoRemoveInterval: 10,
      }),
    })
  )
  app.use(cookieMiddleware)
}

app.set("view engine", "ejs")
app.engine("ejs", require("ejs").__express)

const rootRouter = require("./routes/root")
const searchRouter = require("./routes/search")
const apiRouter = require("./routes/api")

app.use("/", rootRouter)
app.use("/search", searchRouter)
app.use("/api", apiRouter)

app.get("*", (req, res) => {
  res.status(404).render("404")
})

connectToMongo().then((successful) => {
  app.listen(port, () => {
    console.log("Listening on port " + port)
  })
})
