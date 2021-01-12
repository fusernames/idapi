module.exports = async (req, res, fn, options) => {
  if (!options) options = {}
  try {
    const result = await fn(req, req)
    if (!options.disableRespond) res.status(200).json(result)
  } catch (e) {
    console.error(e)
    if (e.status) res.status(e.status).json(e)
    else res.status(500).json('Unhandled Error')
  }
}
