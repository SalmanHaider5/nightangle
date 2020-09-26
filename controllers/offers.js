const gateway = require('../config/braintree')
const { Offer } = require('../models')
const {
    responseMessages: {
        offerSent,
        generalErrorMessage
    },
    codes: {
        success,
        error,
        info
    }
} = require('../constants')

exports.createOffer = (req, res) => {
    const { body } = req
    body.status = 'pending'
    Offer.create(body)
    .then(() => {
        res.json({
            code: success,
            response: {
                title: 'Offer Request Sent',
                message: offerSent
            }
        })
    })
    .catch(err => {
        res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
    })
}