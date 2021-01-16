const routeWrapper = require('./routeWrapper')
const queryParser = require('./queryParser')
const pluralize = require('pluralize')
const { MongooseQueryParser } = require('mongoose-query-parser')
// import { IRoute, ICtx, IRouteCtx, IAuthorizations } from '../types/route'
const parser = new MongooseQueryParser()
const url = require('url')
const chalk = require('chalk')
const queryString = require('query-string')

module.exports = (modelName, routes, idapi) => {
  const router = require('express').Router()
  console.log(chalk.bold.blue('[idapi]'), 'Generating routes...')
  for (let [path, route] of Object.entries(routes)) {
    const lowercaseName = modelName ? modelName.charAt(0).toLowerCase() + modelName.slice(1) : null
    const pluralName = lowercaseName ? pluralize(lowercaseName) : null
    let preBuiltName = undefined

    if (path.startsWith('$')) {
      preBuiltName = path
      const preBuiltRoute = preBuiltRoutes[preBuiltName](pluralName, route)
      route = { ...route, resolver: preBuiltRoute.resolver }
      path = preBuiltRoute.path
    }
    const routeCtx = {
      lowercaseName,
      pluralName,
      modelName,
      route,
      idapi,
    }
    const [method, realPath] = path.split(' ')
    const logs = [
      chalk.bold.blue('[idapi]'),
      `created "${path}"`,
      modelName ? `for ${chalk.magenta(modelName)}` : undefined,
      preBuiltName ? chalk.green(`(generated with ${preBuiltName})`) : undefined,
    ]
    console.log(logs.filter((x) => Boolean(x)).join(' '))
    router[method.toLowerCase()](realPath, async (req, res) => {
      routeWrapper(routeCtx, req, res)
    })
  }
  return router
}

const preBuiltRoutes = {
  $post: (pluralName, route) => ({
    path: `POST /${pluralName}`,
    resolver: async ({ Model, req }) => {
      const result = await Model.create(req.body)
      return result
    },
  }),
  $get: (pluralName, route) => ({
    path: `GET /${pluralName}/:_id`,
    resolver: async ({ Model, req }) => {
      let mainQuery = Model.findOne({ _id: req.params._id })
      if (route.queryMiddleware) {
        await route.queryMiddleware(mainQuery)
      }
      const result = await mainQuery.exec()
      if (!result) throw { status: 404, message: `This ressource doesn't exist` }
      return result
    },
  }),
  $getMany: (pluralName, route) => ({
    path: `GET /${pluralName}`,
    resolver: async ({ req, res, Model }) => {
      const page = req.query.page || 1
      const limit = req.query.limit || 10
      const skip = limit * (page - 1)
      const urlQuery = queryString.stringify(req.query)
      const { filter, sort, select } = urlQuery ? parser.parse(urlQuery) : {}
      let mongooseQuery = Model.find(filter).limit(limit).select(select).skip(skip).sort(sort)
      if (route.queryMiddleware) await route.queryMiddleware(mongooseQuery, { req, res, Model })
      const [results, count] = await Promise.all([mongooseQuery.exec(), Model.countDocuments(filter)])
      return {
        results,
        count,
        pages: Math.ceil(count / limit),
        page,
        full: Boolean(count <= results.length),
      }
    },
  }),
  $put: (pluralName, route) => ({
    path: `PUT /${pluralName}/:_id`,
    resolver: async () => {
      const result = await routeCtx.Model.findOne({ _id: req.params._id })
      if (!result) throw { status: 404, message: `This ressource doesn't exist` }
      result._old = result.toObject()
      for (let [key, value] of Object.entries(req.body)) {
        result[key] = value
      }
      await result.save()
      return result
    },
  }),
  $delete: (pluralName) => ({
    path: `DELETE /${pluralName}/:_id`,
    resolver: async ({ Model, req }) => {
      const result = await Model.findOne({ _id: req.params._id })
      if (!result) throw { status: 404, message: `This ressource doesn't exist` }
      await result.remove()
      return result
    },
  }),
}

// const generatorFunctions = {\
//   $validate: (routeCtx, router) => {
//     router.post(`/${routeCtx.pluralName}/validate`, (req, res) => {
//       routeWrapper(routeCtx, req, res, async () => {
//         const errors = idapi.validators[routeCtx.modelName].validateForm(req.body)
//         if (errors) return errors
//         else return {}
//       })
//     })
//   },
//   $mine: (routeCtx, router) => {
//     router.get(`/${routeCtx.pluralName}/mine`, (req, res) => {
//       routeWrapper(routeCtx, req, res, async () => {
//         const result = await routeCtx.Model.findOne({ user: req.myId })
//         // if (!result) throw { status: 404, message: `Aucune ressource trouvée` }
//         return result
//       })
//     })
//   },
// }
