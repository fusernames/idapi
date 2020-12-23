module.exports = ({ _sort, _page, _limit, _full, ...rest }) => {
  let limit = _limit ? parseInt(_limit) : 8
  let page = _page ? parseInt(_page) : 1
  if (limit > 199) limit = 199
  if (_full) {
    page = 1
    limit = 199
  }
  let result = {
    sort: [['createdAt', -1]],
    where: {},
    limit,
    page,
    skip: limit * (page - 1),
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
