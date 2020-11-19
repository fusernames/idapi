# idapi

Node.js mongoose &amp; express framework to build fast api models and routes created by [https://industrie-digitale.fr](https://industrie-digitale.fr)

## Get started

```js
const idapi = require('idapi')
const jwt = require('jsonwebtoken')

const server = async () => {
  // connect express app and mongo database
  await idapi.init({
    uri: `mongodb+srv://remote:HnljTZq6hWdJzbxe@cluster0.fk2na.mongodb.net/idvisor?retryWrites=true&w=majority`,
    port: 5000,
  })

  // adding a custom middleware to parse the user token
  idapi.app.use((req, res, next) => {
    let token = req.cookies.Authorization || req.headers.authorization
    if (token) {
      jwt.verify(token, 'secret', (err, decoded) => {
        if (!err) req.myId = decoded.data.userId
      })
    }
    next()
  })

  // creating our authorizations functions (for routes)
  idapi.authorizations = {
    public: async () => true, // returning true if access is granted and false if not
    private: async (ctx) => Boolean(ctx.req.myId),
    admin: async (ctx) => {
      if (!ctx.req.myId) return false
      const user = await idapi.User.model.findOne({ _id: ctx.req.id, role: 'admin' })
      if (!user) return false
      return true
    },
  }

  // adding a model "User" with mongoose, check mongoose schema for the second argument
  const userSchema = idapi.schema('User', {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  })

  // the userSchema is a mongoose schema instance
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 8)
    next()
  })

  // adding a validator for our model (validation is used with pre('save', ...) middleware from mongoose)
  idapi.validator('User', {
    email: (Joi) =>
      Joi.string()
        .email({ tlds: { allow: false } })
        .required(),
    firstname: (Joi) => Joi.string().max(30).min(1).required(),
    lastname: (Joi) => Joi.string().max(30).min(1).required(),
    role: (Joi) => Joi.string().valid('admin', 'user').required(),
  })

  // create our mongoose model (important: don't do it before the validator)
  idapi.model('User')

  // generating our routes with pre-built methods: $create, $getMany, $get, $update, $delete + custom routes
  idapi.routes('User', {
    $create: {
      access: 'public', // refering to our authorizations.public function
    },
    $getMany: {
      access: 'public',
      queryMiddleware: (query) => {
        query.select('-password')
      },
    },
    $get: {
      access: 'admin',
    },
    $update: {
      access: 'admin',
      before: (ctx) => (ctx.req.body.password = undefined), // before and after middlewares are available for every routes
    },
    $delete: {
      access: 'admin',
    },
    '/user/current': {
      method: 'get',
      access: 'private',
      resolver: async (ctx) => {
        const user = await Model.findOne({ _id: ctx.req.myId })
        if (!user) throw { status: 404, code: 'Utilisateur introuvable' } // send the response with status as status and code as content
        return user // the returning value is sent in json with status code 200
      },
    },
    '/user/token': {
      method: 'get',
      access: 'public',
      resolver: async (ctx) => {
        const token = await generateToken(ctx.req.query)
        return token
      },
    },
    '/user/password': {
      method: 'put',
      access: 'private',
      resolver: async (ctx) => {
        const user = await ctx.Model.findOne({ _id })
        const match = await bcrypt.compare(password, user.password)
        if (match === false) {
          throw { status: 403, code: 'Mauvais mot de passe' }
        }
      },
    },
  })
}

server()
```
