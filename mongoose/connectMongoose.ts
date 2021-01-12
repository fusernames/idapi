const mongoose = require('mongoose')

module.exports = async (uri: string) => {
  try {
    mongoose.set('debug', true)
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    return mongoose
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}
