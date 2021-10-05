const db = require('../models')
const User = db.User
const jwt = require('jsonwebtoken')
const config = require('../config/auth.config.js')
let cryptoJS = require("crypto-js")
const crypto = require('crypto')
const fs = require('fs')

exports.getPersonal = (req, res) => {
  let token = req.cookies.token
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized'
      })
    }
    userId = decoded.id
    User.findByPk(userId).then(user => {
      return res.status(200).send({
        username: user.username,
        email: user.email,
        dob: user.dob,
        role: user.RoleId
      })
    })
    .catch(err => {
      res.clearCookie('token')
      res.status(404).send({
        message: 'User not found'
      })
    })
  })
}

exports.updatePersonal = (req, res) => {
  let token = req.cookies.token
  let targetField
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized'
      })
    }
    userId = decoded.id
    let { username, email, password, dob } = req.body
    User.findByPk(userId).then(user => {
      if (username) {
        user.username = username
      }
      if (email) {
        user.email = email
        targetField = 'email'
      }
      if (password) {
        user.password = cryptoJS.AES.encrypt(password, config.secret).toString()
      }
      if (dob) {
        user.dob = dob
        targetField = 'dob'
      }
      return user
    })
    .then((user) => {
      user.save().then(success, fail)
    })
  })

  function success(user) {
      return res.status(200).send(user)
  }

  function fail() {
      let message
      switch (targetField) {
        case 'email':
          message = 'Email is already in use'
          break
        case 'dob':
          message = 'Date of birth is not valid'
          break
      }
      return res.status(409).send({message})
  }
}

exports.deletePersonal = (req, res) => {
  let token = req.headers['x-access-token']
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized'
      })
    }
    userId = decoded.id
    User.findByPk(userId).then(user => {
      user.destroy();
      return res.status(204).send({
        message: 'User has been deleted'
      })
    })
  })
}

exports.uploadBook = (req, res) => {
  console.log(req.body)
  const randomString = crypto.randomBytes(5).toString('hex')
  const stream = fs.createWriteStream(`./public/images/${randomString}.png`)
  stream.on('finish', () => {
    console.log('file has been written')
    res.end('file has been written')
  })
  
  stream.write(Buffer.from(req.body.img), 'utf-8')
  stream.end()
}