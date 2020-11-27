const gateway = require('../config/braintree')
const { Offer, Phone, Professional, Company } = require('../models')
const SendMessage                    = require('../config/message')
const {
    appUrl,
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
        error,
        info
    }
} = require('../constants')

exports.createOffer = (req, res) => {
    const { body } = req
    body.status = 'pending'
    Offer.create(body)
    .then(offer => {
        const { professional, address } = body
        Phone.findOne({ where: { userId: professional } })
        .then(model => {
            const { dataValues: { phone } } = model
            const professionalId = professional
            const message = `Hello, you have a new shift offer from NMC Registered at ${address}. Please click this link to view offer: ${appUrl}professional/${professionalId}/requests`
            SendMessage(phone, message)
            Professional.findOne({ where: { userId: professional }, attributes: ['fullName', 'nmcPin'] })
            .then(professional => {
                offer.dataValues.professionalName = professional.dataValues.fullName
                offer.dataValues.professionalNmc = professional.dataValues.nmcPin
                res.json({
                    code: success,
                    response: {
                        title: 'Offer Request Sent',
                        message: offerSent,
                        offer
                    }
                })
            })
            .catch(err => {
                console.log("Error", err)
                res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })    
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
    const { status, professional, company } = body
    const acceptedMsg = `Hello, the NMC Registered professional has accepted your shift offer, please confirm your acceptance via the “Approval” button on your NMC Registered account.`
    const declinedMsg = `Hello, the requested NMC Registered professional has requested to be excused on this occasion and sends their apologies, sorry.`
    const approvedMsg = `Your shift is confirmed by NMC Company, hope you have a good shift. Details are here: ${appUrl}professional/${professional}/requests`
    const rejectedMsg = `Oops! Offered shift by NMC Registered has now been filled by someone else. Offers normally work on a first come first serve basis, sorry this time next time will be better`
    Offer.update(body, { where: { id: offerId } })
    .then(() => {
        if(status === 'approved' || status === 'rejected'){
            Phone.findOne({ where: { userId: professional } })
            .then(model => {
                const { dataValues: { phone } } = model
                const message = status === 'approved' ? approvedMsg : rejectedMsg
                SendMessage(phone, message)
                res.json({
                    code: success,
                    response: {
                        title: 'Offer Status Update',
                        message: status === 'approved' ? offerApproved : offerRejected
                    }
                })

            })
            .catch(err => {
                res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
            })
        }else{
            Company.findOne({ where: { userId: company }, attributes: ['phone'] })
            .then(data => {
                const { dataValues: { phone } } = data
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
        }
        
    })
    .catch(err => {
        res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
    })
}