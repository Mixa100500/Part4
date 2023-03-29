const logger = require('./logger')
const User = require('../moduls/user')
const jwt = require('jsonwebtoken')
const config = require('../utils/config')

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')
  
  if (authorization && authorization.startsWith('Bearer ')) {
    request.token = authorization.replace('Bearer ', '')
  } else {
    request.token = null
  }

  next()
}

const userExtractor = async (request, response, next) => {
  console.log('userEx', request.token)
  if (request.token) {
    console.log('token exist')
    const decodedToken = jwt.verify(request.token, config.SECRET)
    if(decodedToken.id) {
      console.log('token valid')
      request.user = await User.findById(decodedToken.id)
    }
  } else {
    request.user = null
  }

  next()
}

const unkownEndpoint = (request, response) => {
  response.status(404).send({ error: 'uknown endpoint' })
}

const errorHandle = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name ===  'JsonWebTokenError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'token expired'
    })
  }

  next(error)
}

module.exports = {
  tokenExtractor,
  unkownEndpoint,
  errorHandle,
  requestLogger,
  userExtractor
}