// import { IRouteCtx, IRoute, ICtx } from "../types/route"
// const { Request, Response } = require('express')
const respond = require('./respond')

const routeWrapper = ({ modelName, route, idapi }, req, res) => {
  respond(
    req,
    res,
    async () => {
      const ctx = {
        req,
        res,
        Model: idapi[modelName],
      }
      // access
      // console.log(`[idapi] access ${access}, authorizations: ${authorizations[access]}`)
      if (route.access) {
        const accessFn = typeof route.access == 'string' ? idapi.authorizations[route.access] : route.access
        const accessGranted = await accessFn({ access: route.access, req })
        if (!accessGranted) throw { status: 403, message: 'Non autorisé' }
      }
      // model
      // before
      if (route.before) await route.before(ctx)
      // resolver
      let result = await route.resolver(ctx)
      // after
      if (route.after) await route.after(ctx, result)
      return result
    },
    { disableRespond: route.disableRespond }
  )
}

module.exports = routeWrapper
