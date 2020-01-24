const { Professional }        = require('../models')

const {
    codes:{
        error,
        success
    },
    responseMessages:{
        recordAdded,
        generalErrorMessage
    }
} = require('../constants')

exports.create = (req, res) => {
    const { params: { userId }, body } = req
    const professional = body
    professional.userId = userId
    Professional.create(professional)
    .then(() => {
        res.json({ code: success, response: recordAdded })
    })
    .catch(err => {
        res.json({ code: error, response: generalErrorMessage, error: err })
    })
}