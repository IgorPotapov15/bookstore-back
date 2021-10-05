const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const cookieParser = require("cookie-parser")
const crypto = require('crypto')
const fs = require('fs')
const app = express()

let corsOptions = {
  origin: 'http://localhost:3000'
}

const PORT = process.env.PORT || 8080

app.use(cors(corsOptions))
app.use(bodyParser.json({ limit: "50mb" }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static("public"))
app.use(express.json({ limit: "50mb" }))

const db = require('./models')

db.sequelize.sync({force: true}).then(() => {
  db.Role.create({
    role_name: 'user',
  })
  db.Role.create({
    role_name: 'admin',
  })
  console.log('Drop and Resync Db')
})

app.get('/', function(req, res) {
  res.json({ message: "Server is up"})
})

require('./routes/auth.routes')(app)
require('./routes/user.routes')(app)

app.listen(PORT, () => {
  console.log(`${PORT}`)
})