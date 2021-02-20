const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const { User } = require('../models')
const { getGeneralErrorMessage, getResponse, equals } = require('./helpers')


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
        paymentUnsuccessful,
        generalErrorMessage
    },
    codes: {
        success,
        error,
        info
    }
}  = require('../constants')
const stripe  = require('stripe')(secretKey)
const paypalClient = require('./paypal')


exports.createStripeSecret = (req, res) => {
    
    const vatBalance = parseInt(amount) * parseInt(vatPercent)/100,
    netAmount = parseInt(vatBalance) + parseInt(amount)

    stripe.paymentIntents.create({
        amount: netAmount,
        currency,
        payment_method_types: ['card']
    }, (err, intent) => {
        if(err){
            const response = getGeneralErrorMessage(err)
            res.json(response)
        }else{
            const { client_secret } = intent
            const code = client_secret ? success : error,
                title = client_secret ? 'Stripe Loaded' : 'Stripe Error',
                message = client_secret ? secretRetrieved : generalErrorMessage

            const response = getResponse(code, title, message, { stripeSecret: client_secret })
            res.json(response)
        }
    })
}

exports.verifyStripePayment = async (req, res, next) => {
    const { body } = req,
        { paymentIntent: { id } } = body,
        intent = await stripe.paymentIntents.retrieve(id),
        { charges: { data = [] } }= intent || {},
        { status } = data[0] || {}

    if(status && equals(status, "succeeded")){
        next();
    }else{
        const response = getResponse(error, 'Payment not Verified', paymentUnsuccessful)
        res.json(response)
    }
}

exports.capturePaypalTransaction = async (req, res, next) => {
    const { body } = req,
        { orderID } = body
    
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try{

        const capture = await paypalClient.client().execute(request)
        console.log(capture)
        next();

    }catch(err){
        
        const response = getResponse(error, 'Payment not Verified', paymentUnsuccessful)
        res.json(response)

    }
}   