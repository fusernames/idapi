module.exports = ({ _sort, _page, _limit, _full, ...rest }) => {
  let limit = _limit ? _limit : 8
  let page = _page ? _page : 1
  if (_full) {
    page = undefined
    limit = undefined
  }
  let result = {
    sort: [['createdAt', -1]],
    where: {},
    limit,
    skip: limit * (page - 1),
    page: page ? parseInt(page) : undefined,
    full: Boolean(_full),
  }
  if (_sort) {
    let [field, value] = _sort.split(':')
    if (value === '-1' || value === '1') result.sort = [[field, value]]
  }
  for (let [key, value] of Object.entries(rest)) {
    if (key.includes(':')) {
      let [field, operator] = key.split(':')
      if (operator) {
        result.where[field] = {
          ...result.where[field],
          [`$${operator}`]: value,
        }
      }
    } else {
      result.where[key] = value
    }
  }
  return result
}
