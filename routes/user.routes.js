const { authJwt } = require('../middleware')
const controller = require('../controllers/user.controller')
const { validation } = require('../middleware')

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    )
    next()
  })

  app.get(
    '/api/personal/', 
    authJwt.verifyToken,
    controller.getPersonal
  )

  app.patch(
    '/api/personal/',
    authJwt.verifyToken,
    validation,
    controller.updatePersonal
  )

  app.delete(
    '/api/personal/',
    authJwt.verifyToken,
    controller.deletePersonal
  )
}