module.exports = async (req, res, fn, options) => {
  if (!options) options = {}
  try {
    const result = await fn(req, req)
    if (!options.disableRespond) res.status(200).json(result)
  } catch (e) {
    console.error(e)
    if (e.status) res.status(e.status).json(e.code)
    else res.status(400).json('Unhandled Error')
  }
}
