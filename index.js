const connectMongoose = require('./mongoose/connectMongoose')
const connectExpress = require('./express/connectExpress')
const generateRoutes = require('./utils/generateRoutes')
const Validator = require('./utils/Validator')
const queryParser = require('./utils/queryParser')

class Idapi {
  // constructor() {
  //   this.authorizations = {}
  //   this.queryParser = queryParser
  //   this.validators = {}
  //   this.schemas = {}
  // }

  async init({ uri, port }) {
    this.authorizations = {}
    this.queryParser = queryParser
    this.validators = {}
    this.schemas = {}
    this.uri = uri
    this.mongoose = await connectMongoose(uri)
    this.app = connectExpress(port)
    console.log('[idapi] idapi app is connected !')
  }

  schema(name, schema, options) {
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

  model(name) {
    this[name] = this.mongoose.model(name, this.schemas[name])
    return this[name]
  }

  validator(name, getJoiSchema) {
    const validator = new Validator(getJoiSchema)
    const schema = this.schemas[name]
    this.validators[name] = validator
    if (schema) {
      schema.pre('validate', function () {
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

  routes(name, routes) {
    this.app.use(generateRoutes(name, routes, this.authorizations, this))
  }
}

module.exports = new Idapi()
