const {
    stripeCredentials:{
        secretKey,
        currency,
        amount,
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
    stripe.paymentIntents.create({
        amount,
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