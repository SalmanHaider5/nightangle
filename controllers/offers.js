const gateway = require('../config/braintree')
const { Offer, Phone } = require('../models')
const SendMessage                    = require('../config/message')
const {
    appUrl,
    responseMessages: {
        offerSent,
        generalErrorMessage,
        offerAccepted,
        offerDeclined
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
        const { professional } = body
        Phone.findOne({ where: { userId: professional } })
        .then(model => {
            const { dataValues: { phone } } = model
            const message = `Hello, You have new offer request from NMC Registered. Please check your requests at following link ${appUrl}professional/${professional}/requests`
            SendMessage(phone, message)
            res.json({
                code: success,
                response: {
                    title: 'Offer Request Sent',
                    message: offerSent
                }
            })
        })
        .catch(err => {
            console.log('Error 1', err)
            res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
        })
    })
    .catch(err => {
        console.log('Error 2', err)
        res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
    })
}

exports.updateOffer = (req, res) => {
    const { body, params: { offerId } } = req
    const { status, professional } = body
    console.log('Body', body)
    Offer.update(body, { where: { id: offerId } })
    .then(offer => {
        console.log(offer)
        Phone.findOne({ where: { userId: professional } })
        .then(model => {
            const { dataValues: { phone } } = model
            const acceptedMsg = `Hello, Congratulation! Your offer request has been accepted by NMC Registered Professional`
            const declinedMsg = `Hello, We are sorry! You offer request has been declined by NMC Registered Professional`
            const message = status === 'accepted' ? acceptedMsg : declinedMsg
            SendMessage(phone, message)
            res.json({
                code: success,
                response: {
                    title: 'Offer Status Update',
                    message: status === 'accepted' ? offerAccepted : offerDeclined
                }
            })

        })
        .catch(err => {
            console.log('Error', err)
            res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
        })
        
    })
    .catch(err => {
        res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
    })
}