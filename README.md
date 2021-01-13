# idapi
Create an (express + mongoose) complete api in seconds. Created by [id](https://industrie-digitale.fr)

## Get started
```js
const idapi = require('idapi')

const server = async () => {
  // 1. connect express app and mongo database
  await idapi.init({
    uri: process.env.URI,
    port: process.env.PORT,
  })
  // now your server is listening on port and idapi.mongoose is connected
}
```

- [Middlewares](#middlewares)
- [Routes authorization system](#routes-authorization-system)
- [Create a model & a validator](#create-a-model--a-validator)
- [Generate routes](#generate-routes)


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
    },
    firstname: String,
    lastname: String,
    password: String,
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

  // 6. add a validator (optional) for our model (validation is used with pre('validate', ...) middleware from mongoose)
  idapi.validator('User', Joi => ({ // see https://joi.dev/api/?v=17.3.0
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    firstname: Joi.string().max(30).min(1).required(),
    lastname: Joi.string().max(30).min(1).required(),
    role: Joi.string().valid('admin', 'user').required(),
  })

  // 7. validate our mongoose model (important: don't do it before the validator)
  idapi.model('User')
```


## Generate routes
Simple exemple
```js
  // fast route
  idapi.routes(null, {
    'GET /': {
      resolver: async (ctx) => 'Hello World' // ctx object contains { req, res, Model (if provided in 1st arg) }
    },
    'GET /widthDisabledRespond': {
      disableRespond: true, // disableRespond allow you to user ctx.res to respond
      resolver: async (ctx) => ctx.res.json('Hello World') // ctx object contains { req, res, Model (if provided in 1st arg) }
    }
  })
```

Lets create routes our users with some pre-built functions: $post, $getMany, $get, $update, $delete + custom routes
```js
  // lets create routes our users with some pre-built functions: $post, $getMany, $get, $update, $delete + custom routes
  idapi.routes('User', { 
    $post: {
      access: 'public', // refering to our authorizations.public function
    },
    $getMany: { // works with https://www.npmjs.com/package/mongoose-query-parser
      access: 'public',
      queryMiddleware: async (query) => {
        query.select('-password')
      },
    },
    $get: {
      access: 'admin',
      after: async (ctx, result) => {
        delete result.password
      }
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
        const user = await idapi.User.findOne({ _id: ctx.req.myId })
        if (!user) idapi.error(404, { message: `Couldn't find this user` }) // cancel current execution and send response 1st param : code, 2nd param: content you want to send
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
    'PUT /user/:_id/password': {
      access: 'private',
      resolver: async ({ req }) => {
        const user = await idapi.User.findOne({ _id: req.params._id })
        const match = await bcrypt.compare(req.body.password, user.password)
        if (match === false)
          idapi.error(403, { message: 'Bad password' })
        user.password = req.body.newPassword
        await user.save()
        return user
      },
    },
  })
}
```
