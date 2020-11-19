const pluralize = require('pluralize')
const respond = require('./respond')
const parseQuery = require('./parseQuery')
const router = require('express').Router()
const mongoose = require('mongoose')

module.exports = ({
  route,
  modelName,
  before,
  after,
  method,
  queryMiddleware,
  access,
  resolver,
  disableRespond,
  authorizations,
}) => {
  const lowercaseName = modelName.toLowerCase()
  const wrapperArgs = {
    access,
    before,
    after,
    disableRespond,
    modelName,
    lowercaseName,
    authorizations,
  }
  switch (route) {
    case '$create':
      router.post(`/${lowercaseName}`, (req, res) => {
        routeWrapper({
          ...wrapperArgs,
          req,
          res,
          resolver: async ({ Model }) => {
            const result = await Model.create(req.body)
            return result
          },
        })
      })
      break
    case '$getMany':
      router.get(`/${pluralize(lowercaseName)}`, (req, res) => {
        routeWrapper({
          ...wrapperArgs,
          req,
          res,
          resolver: async ({ Model }) => {
            const { where, sort, limit, skip, page, isFullList } = parseQuery(req.query)
            let mainQuery = Model.find(where).skip(skip).limit(limit).sort(sort)
            if (queryMiddleware) {
              await queryMiddleware(mainQuery)
            }
            const [results, count] = await Promise.all([mainQuery.exec(), Model.countDocuments(where)])
            return {
              results,
              count,
              pages: Math.ceil(count / limit),
              page,
              isFullList,
            }
          },
        })
      })
      break
    case '$get':
      router.get(`/${lowercaseName}`, (req, res) => {
        const { where } = parseQuery(req.query)
        routeWrapper({
          ...wrapperArgs,
          req,
          res,
          resolver: async ({ Model }) => {
            const result = await Model.findOne(where)
            if (!result) throw { status: 404, code: `La ressource n'existe pas` }
            return result
          },
        })
      })
      break
    case '$delete':
      router.delete(`/${lowercaseName}`, (req, res) => {
        routeWrapper({
          ...wrapperArgs,
          req,
          res,
          resolver: async ({ Model, req }) => {
            const result = await Model.findOne({ _id: req.body._id })
            if (!result) throw { status: 404, code: `La ressource n'existe pas` }
            await result.remove()
            return result
          },
        })
      })
      break
    case '$update':
      router.put(`/${lowercaseName}`, (req, res) => {
        routeWrapper({
          ...wrapperArgs,
          req,
          res,
          resolver: async ({ Model }) => {
            const result = await Model.findOne({ _id: req.body._id })
            if (!result) throw { status: 404, code: `La ressource n'existe pas` }
            result._old = result.toObject()
            for (let [key, value] of Object.entries(req.body)) {
              result[key] = value
            }
            await result.save()
            return result
          },
        })
      })
      break
    case '$mine': {
      router.get(`/${lowercaseName}/mine`, (req, res) => {
        routeWrapper({
          ...wrapperArgs,
          req,
          res,
          resolver: async ({ Model }) => {
            const result = await Model.findOne({ user: req.userId })
            // if (!result) throw { status: 404, code: `Aucune ressource trouvée` }
            return result
          },
        })
      })
      break
    }
    default:
      if (method) {
        router[method](route, async (req, res) => {
          routeWrapper({
            ...wrapperArgs,
            req,
            res,
            resolver: async ({ Model, req, res }) => {
              const result = await resolver({ Model, req, res })
              return result
            },
          })
        })
      }
  }
  return router
}

const routeWrapper = ({
  req,
  res,
  before,
  after,
  resolver,
  access,
  modelName,
  disableRespond,
  authorizations,
}) => {
  respond(
    req,
    res,
    async () => {
      // access
      if (access && authorizations[access]) {
        const accessGranted = await authorizations[access]({ access, req })
        if (!accessGranted) throw { status: 403, code: 'Unauthorized' }
      }
      // model
      const Model = mongoose.models[modelName]
      // before
      if (before) await before({ Model, req, res })
      // resolver
      const result = await resolver({ Model, req, res })
      // after
      if (after) await after({ Model, result })
      return result
    },
    { disableRespond }
  )
}
