const chalk = require('chalk')

module.exports = (req, res, next) => {
  if (req.originalUrl.includes('/'))
    console.log(chalk.magentaBright.bold(`[${req.method}] ${req.originalUrl}`))
  next()
}
