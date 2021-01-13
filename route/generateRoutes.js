const routeWrapper = require('./routeWrapper')
const queryParser = require('./queryParser')
const pluralize = require('pluralize')
const idapi = require('../')
const { MongooseQueryParser } = require('mongoose-query-parser')
// import { IRoute, ICtx, IRouteCtx, IAuthorizations } from '../types/route'
const parser = new MongooseQueryParser()
const url = require('url')

module.exports = (modelName, routes, idapi) => {
  const router = require('express').Router()
  for (let [path, route] of Object.entries(routes)) {
    const lowercaseName = modelName ? modelName.charAt(0).toLowerCase() + modelName.slice(1) : null
    const Model = modelName ? idapi[modelName] : null
    const pluralName = lowercaseName ? pluralize(lowercaseName) : null
    const routeCtx = {
      lowercaseName,
      pluralName,
      modelName,
      Model: Model || {},
      route,
      idapi,
    }
    if (generatorFunctions[path] && modelName) {
      console.log(`[idapi]: generated ${path} for ${modelName}`)
      generatorFunctions[path](routeCtx, router)
    } else {
      generatorFunctions.$custom(routeCtx, router, path)
    }
  }
  return router
}

const generatorFunctions = {
  $custom: (routeCtx, router, path) => {
    const [method, routePath] = path.split(' ')
    if (method && routePath) {
      router[method.toLowerCase()](routePath, async (req, res) => {
        routeWrapper(routeCtx, req, res, async () => {
          const result = await routeCtx.route.resolver({ Model: routeCtx.Model, req, res })
          return result
        })
      })
    }
  },
  $post: (routeCtx, router) => {
    router.post(`/${routeCtx.pluralName}`, (req, res) => {
      routeWrapper(routeCtx, req, res, async () => {
        const result = await routeCtx.Model.create(req.body)
        return result
      })
    })
  },
  $getMany: (routeCtx, router) => {
    router.get(`/${routeCtx.pluralName}`, (req, res) => {
      routeWrapper(routeCtx, req, res, async () => {
        const page = req.query.page || 1
        const limit = req.query.limit || 10
        const skip = limit * (page - 1)
        const query = parser.parse(url.parse(req.url).query)
        let mainQuery = routeCtx.Model.find(query).limit(limit).skip(skip)
        if (routeCtx.route.queryMiddleware) {
          await routeCtx.route.queryMiddleware(mainQuery)
        }
        const [results, count] = await Promise.all([mainQuery.exec(), routeCtx.Model.countDocuments(query)])
        return {
          results,
          count,
          pages: Math.ceil(count / limit),
          page,
          full: Boolean(count <= results.length),
        }
      })
    })
  },
  $get: (routeCtx, router) => {
    router.get(`/${routeCtx.pluralName}/:_id`, (req, res) => {
      routeWrapper(routeCtx, req, res, async () => {
        let mainQuery = routeCtx.Model.findOne({ _id: req.params._id })
        if (routeCtx.route.queryMiddleware) {
          await routeCtx.route.queryMiddleware(mainQuery)
        }
        const result = await mainQuery.exec()
        if (!result) throw { status: 404, code: `La ressource n'existe pas` }
        return result
      })
    })
  },
  $delete: (routeCtx, router) => {
    router.delete(`/${routeCtx.pluralName}/:_id`, (req, res) => {
      routeWrapper(routeCtx, req, res, async () => {
        const result = await routeCtx.Model.findOne({ _id: req.params._id })
        if (!result) throw { status: 404, code: `La ressource n'existe pas` }
        await result.remove()
        return result
      })
    })
  },
  $put: (routeCtx, router) => {
    router.put(`/${routeCtx.pluralName}/:_id`, (req, res) => {
      routeWrapper(routeCtx, req, res, async () => {
        const result = await routeCtx.Model.findOne({ _id: req.params._id })
        if (!result) throw { status: 404, code: `La ressource n'existe pas` }
        result._old = result.toObject()
        for (let [key, value] of Object.entries(req.body)) {
          result[key] = value
        }
        await result.save()
        return result
      })
    })
  },
  $validate: (routeCtx, router) => {
    router.post(`/${routeCtx.pluralName}/validate`, (req, res) => {
      routeWrapper(routeCtx, req, res, async () => {
        const errors = idapi.validators[routeCtx.modelName].validateForm(req.body)
        if (errors) return errors
        else return {}
      })
    })
  },
  $mine: (routeCtx, router) => {
    router.get(`/${routeCtx.pluralName}/mine`, (req, res) => {
      routeWrapper(routeCtx, req, res, async () => {
        const result = await routeCtx.Model.findOne({ user: req.myId })
        // if (!result) throw { status: 404, code: `Aucune ressource trouvée` }
        return result
      })
    })
  },
}
