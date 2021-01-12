const express = require('express')
const printRoutes = require('./middlewares/printRoutes')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

module.exports = function initServer(port: number) {
  const app = express()
  // middlewares
  app.set('trust proxy', true)
  app.use(bodyParser.json())
  app.use(cookieParser())
  // app.use(printRoutes)

  // routes
  app.listen(port, () => {
    console.log(`[idapi] Listening on port ${port}`)
  })
  return app
}
