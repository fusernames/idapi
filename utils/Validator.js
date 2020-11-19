const Joi = require('joi')

module.exports = class Validator {
  constructor(joiSchema, errorMessages) {
    this.joiSchema = joiSchema
    this.errorMessages = errorMessages
  }

  validateObject(object) {
    let errors = {}
    Object.keys(this.joiSchema).map((key) => {
      const res = this.joiSchema[key](Joi).messages(this.errorMessages).validate(object[key])
      if (res.error) errors[key] = res.error.details[0].message
    })
    if (Object.keys(errors).length > 0) throw { status: 400, code: 'Données invalides', details: errors }
  }

  validateForm(form) {
    let errors = {}
    const formEntries = Object.entries(form)
    for (let [key, value] of formEntries) {
      if (this.joiSchema[key]) {
        const res = this.joiSchema[key](Joi).messages(this.errorMessages).validate(value)
        if (res.error) errors[key] = res.error.details[0].message
      }
    }
    if (Object.keys(errors).length > 0) {
      return errors
    }
    return false
  }

  validateField(fieldname, value) {
    if (this.joiSchema[fieldname]) {
      const { error } = this.joiSchema[fieldname](Joi).messages(this.errorMessages).validate(value)
      if (error) return error.details[0].message
      else return undefined
    }
  }
}
