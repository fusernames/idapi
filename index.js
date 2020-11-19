const connectMongoose = require('./mongoose/connectMongoose')
const connectExpress = require('./express/connectExpress')
const generateRoutes = require('./utils/generateRoutes')
const Validator = require('./utils/Validator')

class Idapi {
  authorizations = {}

  constructor() {
    // this.Joi = Joi
    console.log('Idapi new intance')
  }

  async init({ uri, port }) {
    this.uri = uri
    this.mongoose = await connectMongoose(uri)
    this.app = connectExpress(port)
    console.log(this.app)
  }

  schema(name, schema, options) {
    if (!options)
      options = {
        timestamps: true,
      }
    this[name] = {
      mongooseSchema: this.mongoose.Schema(schema, options),
    }
    return this[name].mongooseSchema
  }

  model(name) {
    this[name].model = this.mongoose.model(name, this[name].mongooseSchema)
    return this[name].model
  }

  validator(name, joiSchema) {
    this[name].validator = new Validator(joiSchema)
    if (this[name].mongooseSchema) {
      this[name].mongooseSchema.pre('save', async function (next) {
        this[name].validator.validateObject(this)
        next()
      })
    }
    return this[name].validator
  }

  routes(name, routes) {
    this.app.use(generateRoutes(name, routes, this.authorizations))
  }
}

module.exports = new Idapi()
