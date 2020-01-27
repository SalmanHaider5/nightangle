const { Company, User }        = require('../models')
const gateway        = require('../config/braintree')

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

exports.add = (req, res) => {
    const { params: { userId }, body } = req
    const company = body
    company.userId = userId
    Company.create(company)
    .then(() => {
        res.json({ code: success, response: recordAdded })
    })
    .catch(err => {
        res.json({ code: error, response: generalErrorMessage, error: err })
    })
}

exports.getPaymentClientToken = (req, res) => {
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