const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const cookieParser = require("cookie-parser")
const app = express()

let corsOptions = {
  origin: 'http://localhost:3000'
}

const PORT = process.env.PORT || 8080

app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

const db = require('./models')

db.sequelize.sync({force: true}).then(() => {
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