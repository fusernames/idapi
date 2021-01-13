# idapi
Generate an (express + mongoose) complete api in seconds. Created by [id](https://industrie-digitale.fr)

1. [Get started](#get-started)
2. [Middlewares](#middlewares)
3. [Routes authorization system](#routes-authorization-system)
4. [Create a model & validator](#create-a-model--validator)
5. [Generate routes](#generate-routes)

## Get started
```js
const idapi = require('idapi')

const server = async () => {
  // 1. connect express app and mongo database
  await idapi.init({
    uri: process.env.URI,
    port: process.env.port,
  })
}
```

## Middlewares
```js
  // 2. adding a custom middleware to parse the user token
  const jwt = require('jsonwebtoken')

  idapi.app.use((req, res, next) => {
    let token = req.cookies.Authorization || req.headers.authorization
    if (token) {
      jwt.verify(token, 'secret', (err, decoded) => {
        if (!err) req.myId = decoded.data.userId
      })
    }
    next()
  })
```

## Routes authorization system
```js
  //3. creating our authorizations functions (for routes)
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
```

## Create a model & a validator
```js
  // 4. adding a model "User" with mongoose, check mongoose schema for the second argument
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

  // 5. the userSchema is a mongoose schema instance, so you can work with it and add hooks
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 8)
    next()
  })

  // 6. add a validator (optional) for our model (validation is used with pre('save', ...) middleware from mongoose)
  idapi.validator('User', {
    email: (Joi) =>
      Joi.string()
        .email({ tlds: { allow: false } })
        .required(),
    firstname: (Joi) => Joi.string().max(30).min(1).required(),
    lastname: (Joi) => Joi.string().max(30).min(1).required(),
    role: (Joi) => Joi.string().valid('admin', 'user').required(),
  })

  // 7. validate our mongoose model (important: don't do it before the validator)
  idapi.model('User')
  ```

## Generate routes
```js

  // generating our routes with pre-built methods: $create, $getMany, $get, $update, $delete + custom routes
  idapi.routes('User', {
    $create: {
      access: 'public', // refering to our authorizations.public function
    },
    $getMany: {
      access: 'public',
      queryMiddleware: async (query) => {
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
    'GET /user/current': {
      access: 'private',
      resolver: async (ctx) => {
        const user = await Model.findOne({ _id: ctx.req.myId })
        if (!user) idapi.error(404, { message: 'Utilisateur introuvable' }) // cancel current execution and send response 1st param : code, 2nd param: content you want to send
        return user // the returning value is sent in json with status code 200
      },
    },
    'GET /user/token': {
      access: 'public',
      resolver: async (ctx) => {
        const token = await generateToken(ctx.req.query)
        return token
      },
    },
    'PUT /user/password': {
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
```
