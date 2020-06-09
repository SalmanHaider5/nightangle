const gateway = require('../config/braintree')
const { User } = require('../models')
const {
    stripeCredentials:{
        secretKey,
        currency,
        amount,
        vatPercent,
        paymentIntentId
    },
    responseMessages: {
        secretRetrieved,
        generalErrorMessage
    },
    codes: {
        success,
        error,
        info
    }
}             = require('../constants')
const stripe  = require('stripe')(secretKey)

exports.createClientSecret = (req, res) => {
    const vatBalance = parseInt(amount) * parseInt(vatPercent)/100
    const netAmount = parseInt(vatBalance) + parseInt(amount)
    stripe.paymentIntents.create({
        amount: netAmount,
        currency,
        payment_method_types: ['card']
    }, (err, intent) => {
        if(err){
            res.json(err)
        }else{
            res.json({
                code: intent.client_secret ? success : error,
                response: {
                    title: intent.client_secret ? 'Secret Retrieved' : 'Error',
                    message: intent.client_secret ? secretRetrieved : generalErrorMessage
                },
                secret: intent.client_secret ? intent.client_secret : '' 
            })
        }
    })
}

exports.getPaypalClientToken = (req, res) => {
    const { params: { userId } } = req
    User.findOne({ where: { id: userId, isVerified: true, role: 'company' } })
    .then(user => {
        if(user === null){
            res.json({ code: error, response: generalErrorMessage })
        }
        else{
            const { dataValues: { email } } = user
            gateway.customer.create({
                id: userId,
                email: email
            }, (err, response) => {
                if(err){
                    res.json({ code: error, response: generalErrorMessage, error: err })
                }else if(response){
                    gateway.clientToken.generate({
                        customerId: userId 
                    }, (error, customer) => {
                        if(error){
                            res.json({ code: error, response: generalErrorMessage, error: response })
                        }else{
                            res.json({ code: success, token: customer.clientToken })
                        }
                    })
                }
            })
        }
    })
    .catch(error => {
        res.json({ code: error, response: generalErrorMessage, error })
    })
}
