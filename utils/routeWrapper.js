const respond = require('./respond')

const routeWrapper = (
  { req, res, before, after, access, modelName, disableRespond, authorizations, idapi },
  resolver
) => {
  respond(
    req,
    res,
    async () => {
      // access
      // console.log(`[idapi] access ${access}, authorizations: ${authorizations[access]}`)
      if (access && authorizations[access]) {
        const accessGranted = await authorizations[access]({ access, req })
        if (!accessGranted) throw { status: 403, code: 'Unauthorized' }
      }
      // model
      const Model = idapi[modelName]
      // before
      if (before) await before({ Model, req, res })
      // resolver
      let result = await resolver({ Model, req, res })
      // after
      if (after) await after({ Model, req, res, result })
      return result
    },
    { disableRespond }
  )
}

module.exports = routeWrapper
