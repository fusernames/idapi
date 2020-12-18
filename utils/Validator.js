const Joi = require('joi')
const errorMessages = require('./errorMessages')

module.exports = class Validator {
  constructor(joiSchema) {
    this.joiSchema = joiSchema(Joi)
  }

  validateObject(object) {
    let errors = {}
    Object.keys(this.joiSchema).map((key) => {
      const res = this.joiSchema[key].messages(errorMessages).validate(object[key])
      if (res.error) errors[key] = res.error.details[0].message
    })
    if (Object.keys(errors).length > 0)
      throw { status: 400, code: 'Erreur lors de la création', validation: errors }
  }

  validateForm(form) {
    let errors = {}
    const formEntries = Object.entries(form)
    for (let [key, value] of formEntries) {
      if (this.joiSchema[key]) {
        const res = this.joiSchema[key].messages(errorMessages).validate(value)
        if (res.error) errors[key] = res.error.details[0].message
      }
    }
    return errors
  }

  validateField(fieldname, value) {
    if (this.joiSchema[fieldname]) {
      const { error } = this.joiSchema[fieldname].messages(errorMessages).validate(value)
      if (error) return error.details[0].message
      else return undefined
    }
  }
}
