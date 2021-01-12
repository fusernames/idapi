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

interface RouteCtx {
  lowercaseName?: string | null;
  authorizations: Authorizations
  route: Route
  modelName: string
  Model: any
}

interface Authorizations {
  [index: string]: Promise<boolean>
}

interface Route {
  path: string;
  method: string;
  access: string | Promise<boolean>;
  before?: () => Promise<void>;
  resolver?: (ctx: any) => Promise<any>;
  after?: () => Promise<void>;
  queryMiddleware: (query: any) => void
}


module.exports = (modelName: string, routes: Route[], authorizations: Authorizations) => {
  for (let route of routes) {
    const lowercaseName = modelName ? modelName.charAt(0).toLowerCase() + modelName.slice(1) : undefined
    const Model = idapi[modelName]
    const routeCtx: RouteCtx = {
      lowercaseName,
      authorizations,
      modelName,
      Model: Model || {},
      route
    }
    if (generatorFunctions[route.path]) {
      console.log(`[idapi]: generated ${route.path} for ${modelName}`)
      generatorFunctions[route.path](routeCtx)
    } else {
      generatorFunctions.$custom(routeCtx)
    }
  }
}

const generatorFunctions = {
  $custom: (routeCtx: RouteCtx) => {
    if (routeCtx.route.method) {
      idapi.app[routeCtx.route.method](routeCtx.route.path, async (req: Request, res: Response) => {
        routeWrapper(routeCtx, req, res, async () => {
          const result = await routeCtx.route.resolver({ Model: routeCtx.Model, req, res })
          return result
        })
      })
    }
  },
  $post: (routeCtx: RouteCtx) => {
    idapi.app.post(`/${routeCtx.lowercaseName}`, (req: Request, res: Response) => {
      routeWrapper(routeCtx, req, res, async () => {
        const result = await routeCtx.Model.create(req.body)
        return result
      })
    })
  },
  $getMany: (routeCtx: RouteCtx) => {
    idapi.app.get(`/${pluralize(routeCtx.lowercaseName)}`, (req: Request, res: Response) => {
      routeWrapper(routeCtx, req, res, async () => {
        const { where, sort, limit, skip, page, full } = queryParser(req.query)
        let mainQuery = routeCtx.Model.find(where).skip(skip).limit(limit).sort(sort)
        if (routeCtx.route.queryMiddleware) {
          await routeCtx.route.queryMiddleware(mainQuery)
        }
        const [results, count] = await Promise.all([mainQuery.exec(), routeCtx.Model.countDocuments(where)])
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
  $get: (routeCtx: RouteCtx) => {
    idapi.app.get(`/${routeCtx.lowercaseName}`, (req: Request, res: Response) => {
      const { where } = queryParser(req.query)
      routeWrapper(routeCtx, req, res, async () => {
        let mainQuery = routeCtx.Model.findOne(where)
        if (routeCtx.route.queryMiddleware) {
          await routeCtx.route.queryMiddleware(mainQuery)
        }
        const result = await mainQuery.exec()
        if (!result) throw { status: 404, code: `La ressource n'existe pas` }
        return result
      })
    })
  },
  $delete: (routeCtx: RouteCtx) => {
    idapi.app.delete(`/${routeCtx.lowercaseName}`, (req: Request, res: Response) => {
      routeWrapper(routeCtx, req, res, async () => {
        const result = await routeCtx.Model.findOne({ _id: req.body._id })
        if (!result) throw { status: 404, code: `La ressource n'existe pas` }
        await result.remove()
        return result
      })
    })
  },
  $put: (routeCtx: RouteCtx) => {
    idapi.app.put(`/${routeCtx.lowercaseName}`, (req: Request, res: Response) => {
      routeWrapper(routeCtx, req, res, async () => {
        const result = await routeCtx.Model.findOne({ _id: req.body._id })
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
  $validate: (routeCtx: RouteCtx) => {
    idapi.app.post(`/${routeCtx.lowercaseName}/validate`, (req: Request, res: Response) => {
      routeWrapper(routeCtx, req, res, async () => {
        const errors = idapi.validators[routeCtx.modelName].validateForm(req.body)
        if (errors) return errors
        else return {}
      })
    })
  },
  $mine: (routeCtx: RouteCtx) => {
    idapi.app.get(`/${routeCtx.lowercaseName}/mine`, (req: Request, res: Response) => {
      routeWrapper(routeCtx, req, res, async () => {
        const result = await routeCtx.Model.findOne({ user: req.myId })
        // if (!result) throw { status: 404, code: `Aucune ressource trouvée` }
        return result
      })
    })
  },
}
