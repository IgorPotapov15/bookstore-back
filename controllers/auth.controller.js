const db = require('../models')
const config = require('../config/auth.config')
const User = db.User
const { validationResult } = require('express-validator')

let jwt = require('jsonwebtoken')
let cryptoJS = require("crypto-js");

exports.signup = (req, res) => {
  const errors = validationResult(req)
    if (!errors.isEmpty()) {
      let errorsObj = errors.array()
      let newMsg
      if (errorsObj[0].param === 'email') {
        newMsg = 'Invalid email address'
      }
      if (errorsObj[0].param === 'password') {
        newMsg = 'Password should be longer than 5 symbols'
      }
      return res.status(400).json({ newMsg })
    }
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: cryptoJS.AES.encrypt(req.body.password, config.secret).toString(),
    dob: req.body.dob
  })
  .then(() => {
    res.send({ message: 'User was registered successfully' })
  })
  .catch(err => {
    res.status(500).send({ message: err.message })
  })
}

exports.signin = (req, res) => {
  User.findOne({
    where: {
      email: req.body.email
    }
  })
  .then(user => {
    if (!user) {
      return res.status(404).send({ message: 'User not found' })
    }

    let decrPass = (cryptoJS.AES.decrypt(user.password, config.secret)).toString(cryptoJS.enc.Utf8)
    let passIsValid = req.body.password === decrPass;

    if (!passIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: 'Invalid password'
      })
    }

    let token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: 86400
    })

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      accessToken: token
    })
  })
  .catch(err => {
    console.log(err)
    res.status(500).send({ message: err.message })
  })
}