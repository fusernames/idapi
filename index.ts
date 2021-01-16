
const connectMongoose = require('./mongoose/connectMongoose')
const connectExpress = require('./express/connectExpress')
const generateRoutes = require('./route/generateRoutes')
const queryParser = require('./route/queryParser')
const Validator = require('./validator/Validator')
const error = require('./utils/error')
import { Authorizations, Routes } from './types/route'
import { Schema } from 'mongoose'

interface IdapiOptions {
  uri: string
  port: number
}

class Idapi {
  authorizations?: Authorizations
  queryParser: any
  validators: any
  schemas: any
  uri: any
  app: any
  mongoose: any
  error: () => void
  [index: string]: any

  constructor() {
    this.authorizations = {}
    this.queryParser = queryParser
    this.validators = {}
    this.schemas = {}
    this.error = error
  }

  async init({ uri, port }: IdapiOptions) {
    this.uri = uri
    this.mongoose = await connectMongoose(uri)
    this.app = connectExpress(port)
    console.log('[idapi] idapi app is connected !')
  }

  schema(name: string, schema: Schema, options: any) {
    if (!options)
      options = {
        timestamps: true,
      }
    this.schemas = {
      ...this.schemas,
      [name]: this.mongoose.Schema(schema, options),
    }
    return this.schemas[name]
  }

  model(name: string) {
    this[name] = this.mongoose.model(name, this.schemas[name])
    return this[name]
  }

  validator(name: string, getJoiSchema: (Joi: any) => object) {
    const validator = new Validator(getJoiSchema)
    const schema = this.schemas[name]
    this.validators[name] = validator
    if (schema) {
      schema.pre('validate', function (this: any) {
        console.log('[idapi] validation check - pre validate')
        validator.validateObject(this)
      })
      // schema.pre('save', function () {
      //   console.log('[idapi] validation check - pre save')
      //   validator.validateObject(this)
      // })
    }
    return this.validators[name]
  }

  routes(modelName: string | null, routes: Routes) {
    this.app.use(generateRoutes(modelName, routes, this))
  }
}

module.exports = new Idapi()
