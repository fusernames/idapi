module.exports = (status, content) => {
  throw { status, ...content }
}
