const { Company, User }        = require('../models')
const gateway        = require('../config/braintree')

const {
    codes:{
        error,
        success,
        info
    },
    responseMessages:{
        recordAdded,
        generalErrorMessage,
        noRecord,
        addRecord,
        recordFound
    }
} = require('../constants')

exports.add = (req, res) => {
    const { params: { userId }, body } = req
    const company = body
    company.userId = userId
    Company.create(company)
    .then(() => {
        res.json({ code: success, response: { title: 'Record Added', message: recordAdded } })
    })
    .catch(err => {
        res.json({ code: error, response: { title: 'Error', message: generalErrorMessage }, error: err })
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

exports.getCompanyDetails = (req, res) => {
    const { params: { userId } } = req
    User.findOne({ where: { id: userId, isVerified: true } })
    .then(user => {
        if(user === null){
            res.json({ code: error, response: { title: 'Not Found', message: noRecord } })
        }else{
            Company.findOne({ where: { userId } })
            .then(company => {
                if(company === null){
                    res.json({ code: info, response: { title: 'Profile Verified', message: addRecord } })   
                }else{
                    res.json({ code: success, response: { title: 'Record Found', message: recordFound }, company })
                }
            })
        }
    })
}