const db = require('../models')
const User = db.User
const jwt = require('jsonwebtoken')
const config = require('../config/auth.config.js')
let cryptoJS = require("crypto-js")

exports.getPersonal = (req, res) => {
  let token = req.headers['x-access-token']
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized'
      })
    }
    userId = decoded.id
    User.findByPk(userId).then(user => {
      return res.status(200).send({
        id: user.id,
        username: user.username,
        email: user.email
      })
    })
  })
}

exports.updatePersonal = (req, res) => {
  let token = req.headers['x-access-token']
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