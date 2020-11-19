const generateRoute = require('./generateRoute')
const router = require('express').Router()

module.exports = (modelName, routes, authorizations) => {
  for (let [route, options] of Object.entries(routes)) {
    router.use(generateRoute({ modelName, route, authorizations, ...options }))
  }
  return router
}
