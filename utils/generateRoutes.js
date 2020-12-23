const routeWrapper = require('./routeWrapper')
const queryParser = require('./queryParser')
const pluralize = require('pluralize')

module.exports = (modelName, routes, authorizations, idapi) => {
  const router = require('express').Router()
  for (let [routeName, options] of Object.entries(routes)) {
    const lowercaseName = modelName ? modelName.charAt(0).toLowerCase() + modelName.slice(1) : null
    const ctx = {
      lowercaseName,
      authorizations,
      idapi,
      routeName,
      modelName,
      ...options,
    }
    if (GENERATOR_FUNCTIONS[routeName]) {
      console.log(`[idapi]: generated ${routeName} for ${modelName}`)
      GENERATOR_FUNCTIONS[routeName](ctx, router)
    } else {
      GENERATOR_FUNCTIONS.$custom(ctx, router)
    }
  }
  return router
}

const GENERATOR_FUNCTIONS = {
  $custom: (ctxRouter, router) => {
    if (ctxRouter.method) {
      router[ctxRouter.method](ctxRouter.routeName, async (req, res) => {
        routeWrapper({ ...ctxRouter, req, res }, async ({ Model, req, res }) => {
          const result = await ctxRouter.resolver({ Model, req, res })
          return result
        })
      })
    }
  },
  $post: (ctxRouter, router) => {
    router.post(`/${ctxRouter.lowercaseName}`, (req, res) => {
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model }) => {
        const result = await Model.create(req.body)
        return result
      })
    })
  },
  $getMany: (ctxRouter, router) => {
    router.get(`/${pluralize(ctxRouter.lowercaseName)}`, (req, res) => {
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model }) => {
        const { where, sort, limit, skip, page, full } = queryParser(req.query)
        let mainQuery = Model.find(where).skip(skip).limit(limit).sort(sort)
        if (ctxRouter.queryMiddleware) {
          await ctxRouter.queryMiddleware(mainQuery)
        }
        const [results, count] = await Promise.all([mainQuery.exec(), Model.countDocuments(where)])
        return {
          results,
          count,
          pages: Math.ceil(count / limit),
          page,
          full,
        }
      })
    })
  },
  $get: (ctxRouter, router) => {
    router.get(`/${ctxRouter.lowercaseName}`, (req, res) => {
      const { where } = queryParser(req.query)
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model }) => {
        let mainQuery = Model.findOne(where)
        if (ctxRouter.queryMiddleware) {
          await ctxRouter.queryMiddleware(mainQuery)
        }
        const result = await mainQuery.exec()
        if (!result) throw { status: 404, code: `La ressource n'existe pas` }
        return result
      })
    })
  },
  $delete: (ctxRouter, router) => {
    router.delete(`/${ctxRouter.lowercaseName}`, (req, res) => {
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model, req }) => {
        const result = await Model.findOne({ _id: req.body._id })
        if (!result) throw { status: 404, code: `La ressource n'existe pas` }
        await result.remove()
        return result
      })
    })
  },
  $update: (ctxRouter, router) => {
    router.put(`/${ctxRouter.lowercaseName}`, (req, res) => {
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model }) => {
        const result = await Model.findOne({ _id: req.body._id })
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
  $validate: (ctxRouter, router) => {
    router.post(`/${ctxRouter.lowercaseName}/validate`, (req, res) => {
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model, req }) => {
        const errors = ctxRouter.idapi.validators[ctxRouter.modelName].validateForm(req.body)
        if (errors) return errors
        else return {}
      })
    })
  },
  $mine: (ctxRouter, router) => {
    router.get(`/${ctxRouter.lowercaseName}/mine`, (req, res) => {
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model }) => {
        const result = await Model.findOne({ user: req.myId })
        // if (!result) throw { status: 404, code: `Aucune ressource trouvée` }
        return result
      })
    })
  },
}
