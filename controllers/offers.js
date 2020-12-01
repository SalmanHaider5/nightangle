const SendMessage = require('../config/message')
const {
    Offer,
    Phone,
    Professional,
    Company
} = require('../models')
const {
    getResponse,
    getGeneralErrorMessage,
    getNewOfferMessage,
    setNewOffer,
    getOfferStatusMessage
} = require('./helpers')
const {
    responseMessages: {
        offerSent,
        generalErrorMessage,
        offerAccepted,
        offerDeclined,
        offerApproved,
        offerRejected
    },
    codes: {
        success,
        error
    }
} = require('../constants')

exports.createOffer = (req, res) => {
    const { body, params: { userId } } = req
    body.status = `pending`
    Offer.create(body)
    .then(offer => {
        const { professional, address } = body
        Phone.findOne({ where: { userId: professional } })
        .then(userPhone => {
            if(userPhone){
                const { dataValues: { phone } } = userPhone
                SendMessage(phone, getNewOfferMessage(professional, address))
                Professional.findOne({ where: { userId: professional }, attributes: ['fullName', 'nmcPin'] })
                .then(row => {
                    const data = setNewOffer(row.dataValues, offer.dataValues)
                    const response = getResponse(success, 'Offer Request Sent', offerSent, data)
                    res.json(response)
                })
                .catch(err => {
                    const response = getGeneralErrorMessage(err)
                    res.json(response)
                })
            }else{
                const response = getResponse(error, 'Unable to Send Message', generalErrorMessage)
                res.json(response)
            }
        })
    })
    .catch(err => {
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}

exports.updateOffer = (req, res) => {
    const { body, params: { offerId } } = req
    Offer.update(body, { where: { id: offerId } })
    .then(() => {
        const { status } = body
        if(status === 'approved' || status === 'rejected'){
            const { professional } = body
            Phone.findOne({ where: { userId: professional }, attributes: ['phone'] })
            .then(userPhone => {
                if(userPhone){
                    const { dataValues: { phone } } = userPhone
                    const message = getOfferStatusMessage(status, professional)
                    SendMessage(phone, message)
                    const toastMessage = status === 'approved' ? offerApproved : offerRejected
                    const response = getResponse(success, 'Offer Status Update', toastMessage)
                    res.json(response)
                }else{
                    const response = getResponse(error, 'Unable to Send Message', generalErrorMessage)
                    res.json(response)
                }
            })
            .catch(err => {
                const response = getGeneralErrorMessage(err)
                res.json(response)
            })
        }else{
            const { company } = body
            Company.findOne({ where: { userId: company }, attributes: ['phone'] })
            .then(record => {
                if(record){
                    const { dataValues: { phone } } = record
                    const message = getOfferStatusMessage(status)
                    SendMessage(phone, message)
                    const toastMessage = status === 'accepted' ? offerAccepted : offerDeclined
                    const response = getResponse(success, 'Offer Status Update', toastMessage)
                    res.json(response)
                }else{
                    const response = getResponse(error, 'Unable to Send Message', generalErrorMessage)
                    res.json(response)
                }
            })
            .catch(err => {
                const response = getGeneralErrorMessage(err)
                res.json(response)
            })
        }
    })
    .catch(err => {
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}