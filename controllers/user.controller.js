const db = require('../models')
const User = db.User
const Book = db.Book
const jwt = require('jsonwebtoken')
const config = require('../config/auth.config.js')
let cryptoJS = require("crypto-js")
const crypto = require('crypto')
const fs = require('fs')
const { Op } = require('sequelize')

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
  // const randomString = crypto.randomBytes(5).toString('hex')
  // const stream = fs.createWriteStream(`./public/images/${randomString}.png`)
  // stream.on('finish', () => {
  //   console.log('file has been written')
  // })
  
  // stream.write(Buffer.from(req.body.img), 'utf-8')
  // stream.end()

  let token = req.cookies.token
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized'
      })
    }
    userId = decoded.id
    User.findByPk(userId).then(user => {
      Book.create({
        img: req.body.img,
        img2: req.body.img2.length > 10 ? req.body.img2 : null,
        name: req.body.name,
        description: req.body.description,
        genre: req.body.genre,
        author: req.body.author,
        rating: req.body.rating,
        price: req.body.price
      })
      .then(book => {
        book.setUser(userId)
        res.send({ message: 'Book uploaded' })
      })
      .catch(err => {
        res.status(500).send({ message: err.message })
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

exports.getBooks = async (req, res) => {
  console.log(req.query)
  let resArr = {
    books: []
  }
  let filterObj = {}

  if (req.query.filterBy) {
    if(req.query.filterBy === 'price' || req.query.filterBy === 'rating') {
      if (!req.query.from) {
        filterObj[req.query.filterBy] = {
          [Op.lt]: [req.query.to]
        }
      } else if (!req.query.to) {
        filterObj[req.query.filterBy] = {
          [Op.gt]: [req.query.from]
        }
      } else {
        filterObj[req.query.filterBy] = {
          [Op.between]: [req.query.from, req.query.to]
        }
      }
    } else {
      filterObj[req.query.filterBy] = req.query.filterValue
    }
  }
  try {
    const rawBooks = await Book.findAndCountAll({
      limit: 5,
      offset: (req.query.page - 1) * 5,
      order: [[req.query.sortBy, req.query.order]],
      where: filterObj
    })
  
    await rawBooks.rows.forEach(item => {
      resArr.books.push({
        id: item.id,
        img: Buffer.from(item.img).toString('base64'),
        img2: !item.img2 ? null : Buffer.from(item.img2).toString('base64'),
        name: item.name,
        description: item.description,
        genre: item.genre,
        author: item.author,
        rating: item.rating,
        price: item.price,
        postData: item.createdAt
      })
    })
    resArr.count = rawBooks.count
    res.status(200).send(resArr)
  } catch (error) {
    res.status(400).send({
      message: 'Bad request'
    })
  }
  
}

exports.deleteBooks = async (req, res) => {
  const targetItem = await Book.findOne({
    where:{
      id: req.body.id
    }
  })
  try {
    targetItem.destroy()
    res.status(204).send('OK')
  } catch(error) {
    res.status(404).send({
      message: 'Book is not found'
    })
  }
}