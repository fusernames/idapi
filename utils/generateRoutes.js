const generateRoute = require('./generateRoute')
const router = require('express').Router()

module.exports = (modelName, routes, authorizations, idapi) => {
  for (let [route, options] of Object.entries(routes)) {
    router.use(generateRoute({ modelName, route, authorizations, idapi, ...options }))
  }
  return router
}
