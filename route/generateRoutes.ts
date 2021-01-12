import { object } from "joi"
import { Request, Response } from 'express';

const routeWrapper = require('./routeWrapper')
const queryParser = require('./queryParser')
const pluralize = require('pluralize')
const idapi = require('../')

interface ICtx {
  Model: object
  req: Request,
  res: Response,
}

interface RouterContext {
  lowercaseName?: string | null;
  authorizations: Authorizations
  route: IRoute
  modelName?: string
}

interface Authorizations {
  [index: string]: Promise<boolean>
}

interface IRoute {
  path: string;
  method: string;
  access: string | Promise<boolean>;
  before?: () => Promise<void>;
  resolver?: (ctx: any) => Promise<any>;
  after?: () => Promise<void>;
  queryMiddleware: (query: any) => void
}


module.exports = (modelName: string, routes: IRoute[], authorizations: Authorizations) => {
  const router = require('express').Router()
  for (let route of routes) {
    const lowercaseName = modelName ? modelName.charAt(0).toLowerCase() + modelName.slice(1) : undefined
    const ctxRouter: RouterContext = {
      lowercaseName,
      authorizations,
      modelName,
      route
    }
    if (generatorFunctions[route.path]) {
      console.log(`[idapi]: generated ${route.path} for ${modelName}`)
      generatorFunctions[route.path](ctxRouter, router)
    } else {
      generatorFunctions.$custom(ctxRouter, router)
    }
  }
  return router
}

const generatorFunctions = {
  $custom: (ctxRouter: RouterContext, router) => {
    if (ctxRouter.route.method) {
      router[ctxRouter.route.method](ctxRouter.route.path, async (req: Request, res: Response) => {
        routeWrapper({ ...ctxRouter, req, res }, async ({ Model }) => {
          const result = await ctxRouter.route.resolver({ Model, req, res })
          return result
        })
      })
    }
  },
  $post: (ctxRouter: RouterContext, router) => {
    router.post(`/${ctxRouter.lowercaseName}`, (req: Request, res: Response) => {
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model }) => {
        const result = await Model.create(req.body)
        return result
      })
    })
  },
  $getMany: (ctxRouter: RouterContext, router) => {
    router.get(`/${pluralize(ctxRouter.lowercaseName)}`, (req: Request, res: Response) => {
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model }) => {
        const { where, sort, limit, skip, page, full } = queryParser(req.query)
        let mainQuery = Model.find(where).skip(skip).limit(limit).sort(sort)
        if (ctxRouter.route.queryMiddleware) {
          await ctxRouter.route.queryMiddleware(mainQuery)
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
  $get: (ctxRouter: RouterContext, router) => {
    router.get(`/${ctxRouter.lowercaseName}`, (req: Request, res: Response) => {
      const { where } = queryParser(req.query)
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model }) => {
        let mainQuery = Model.findOne(where)
        if (ctxRouter.route.queryMiddleware) {
          await ctxRouter.route.queryMiddleware(mainQuery)
        }
        const result = await mainQuery.exec()
        if (!result) throw { status: 404, code: `La ressource n'existe pas` }
        return result
      })
    })
  },
  $delete: (ctxRouter: RouterContext, router) => {
    router.delete(`/${ctxRouter.lowercaseName}`, (req: Request, res: Response) => {
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model }) => {
        const result = await Model.findOne({ _id: req.body._id })
        if (!result) throw { status: 404, code: `La ressource n'existe pas` }
        await result.remove()
        return result
      })
    })
  },
  $put: (ctxRouter: RouterContext, router) => {
    router.put(`/${ctxRouter.lowercaseName}`, (req: Request, res: Response) => {
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
  $validate: (ctxRouter: RouterContext, router) => {
    router.post(`/${ctxRouter.lowercaseName}/validate`, (req: Request, res: Response) => {
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model, req }) => {
        const errors = idapi.validators[ctxRouter.modelName].validateForm(req.body)
        if (errors) return errors
        else return {}
      })
    })
  },
  $mine: (ctxRouter, router) => {
    router.get(`/${ctxRouter.lowercaseName}/mine`, (req: Request, res: Response) => {
      routeWrapper({ ...ctxRouter, req, res }, async ({ Model }) => {
        const result = await Model.findOne({ user: req.myId })
        // if (!result) throw { status: 404, code: `Aucune ressource trouvée` }
        return result
      })
    })
  },
}
