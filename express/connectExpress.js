const express = require('express')
const middlewares = require('./middlewares')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

module.exports = function initServer(port) {
  const app = express()
  // middlewares
  app.set('trust proxy', true)
  // app.use(cors())
  app.use(bodyParser.json())
  app.use(cookieParser())
  app.use(middlewares.printRoute)

  // routes
  app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
  return app
}
