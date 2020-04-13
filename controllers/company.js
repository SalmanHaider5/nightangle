const { hashSync, compareSync }      = require('bcryptjs')
const { Company, User, Professional }        = require('../models')
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
        recordFound,
        passwordChanged,
        invalidCurrentPassword,
        profileUpdated,
        accessDenied
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

exports.changePassword = (req, res) => {
    console.log('Reached...!')
    const { params: { userId }, body: { currentPassword, newPassword } } = req
    User.findOne({ where: { id: userId } })
    .then(user => {
        if(user){
            const isValid = compareSync(currentPassword, user.dataValues.password)
            if(isValid){
                const hashedPassword = hashSync(newPassword, 8)
                User.update({ password: hashedPassword }, { where: { id: userId } })
                .then(() => {
                    res.json({
                        code: success,
                        response: {
                            title: 'Password Updated',
                            message: passwordChanged
                        }
                    })
                })
                .catch(err => {
                    res.json({
                        code: error,
                        response: {
                            title: 'Error',
                            message: generalErrorMessage
                        },
                        error: err
                    })
                })
            }else{
                res.json({
                    code: error,
                    response: {
                        title: 'Invalid Password',
                        message: invalidCurrentPassword
                    }
                })
            }
        }else{
            res.json({
                code: error,
                response: {
                    title: 'Error',
                    message: generalErrorMessage
                }
            })
        }
    })
    .catch(err => {
        console.log('Error', err)
        res.json({
            code: error,
            response: {
                title: 'Error',
                message: generalErrorMessage
            },
            error: err
        })
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
                    company.dataValues.email = user.email
                    company.dataValues.isVerified = user.isVerified
                    res.json({ code: success, response: { title: 'Record Found', message: recordFound }, company })
                }
            })
        }
    })
}

exports.updateCompany = (req, res) => {
    const { params: { userId }, body } = req
    Company.findOne({ where: { userId } })
    .then(company => {
        if(company === null){
            res.json({
                code: error,
                response: {
                    title: 'Error',
                    message: generalErrorMessage
                },
                error: err
            })
        }else{
            Company.update(body, { where: { userId } })
            .then(() => {
                res.json({
                    code: success,
                    response: {
                        title: 'Profile Updated',
                        message: profileUpdated
                    }
                })
            })
            .catch(err => {
                res.json({
                    code: error,
                    response: {
                        title: 'Error',
                        message: generalErrorMessage
                    },
                    error: err
                })
            })
        }
    })
    .catch(err => {
        res.json({
            code: error,
            response: {
                title: 'Error',
                message: generalErrorMessage
            },
            error: err
        })
    })
}

exports.searchProfessionals = (req, res) => {
    const { params: { userId, skill } } = req
    User.findOne({ where: { id: userId, isVerified: true } })
    .then(user=> {
        if(user){
            Company.findOne({ where: { userId, isPaid: true } })
            .then(company=> {
                if(company){
                    Professional.findAll({ where: { qualification: skill } })
                    .then(professionals=> {
                        res.json({
                            code: success,
                            professionals
                        })
                    })
                }else{
                    res.json({
                        code: error,
                        response: {
                            title: 'Access Denied',
                            message: accessDenied
                        }
                    })
                }
            })
        }else{
            res.json({
                code: error,
                response: {
                    title: 'User not Found',
                    message: generalErrorMessage
                }
            })
        }
    })
}