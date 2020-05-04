const { hashSync, compareSync }      = require('bcryptjs')
const moment                         = require('moment')
const { Company, User, Professional, Timesheet, SingleTimesheet, Payment, Phone }        = require('../models')

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
        accessDenied,
        paymentReceived
    },
    stripeCredentials: {
        amount
    }
} = require('../constants')

exports.add = (req, res) => {
    const { params: { userId }, body } = req
    const company = body
    company.userId = userId
    const payment = {}
    payment.balance = amount
    payment.payDate = ''
    payment.status = false
    payment.userId = userId
    Company.create(company)
    .then(() => {
        Payment.create(payment)
        .then(() => {
            res.json({ code: success, response: { title: 'Record Added', message: recordAdded } })
        })
        .catch(err => {
            res.json({ code: error, response: { title: 'Error', message: generalErrorMessage }, error: err })
        })
    })
    .catch(err => {
        res.json({ code: error, response: { title: 'Error', message: generalErrorMessage }, error: err })
    })
}

exports.changePassword = (req, res) => {
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
                    const company = {}
                    company.email = user.email
                    company.isVerified = user.isVerified
                    company.isPaid = false
                    company.balance = amount
                    company.payDate = ''
                    res.json({ code: info, response: { title: 'Profile Verified', message: addRecord }, company })   
                }else{
                    company.dataValues.email = user.email
                    company.dataValues.isVerified = user.isVerified
                    Payment.findOne({ where: { userId } })
                    .then((payment) => {
                        if(payment){
                            const { dataValues: { status, payDate, balance } } = payment
                            company.dataValues.isPaid = status
                            company.dataValues.payDate = payDate
                            company.dataValues.balance = balance
                            res.json({ code: success, response: { title: 'Record Found', message: recordFound }, company })
                        }else{
                            company.dataValues.isPaid = false
                            company.dataValues.balance = amount
                            company.dataValues.payDate = ''
                            res.json({ code: success, response: { title: 'Record Found', message: recordFound }, company })
                        }
                    })
                    .catch(err=> {
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
            .catch(err=> {
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
            Payment.findOne({  where: { userId, status: true } })
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

exports.searchTimesheets = (req, res) => {
    const { params: { professionalId } } = req
    Timesheet.findAll({ where: { userId: professionalId } })
    .then(timesheets => {
        Phone.findOne({ where: { userId: professionalId } })
        .then(phone => {
            User.findOne({ where: { id: professionalId } })
            .then(user => {
                const model = {}
                model.timesheets = timesheets
                model.phone = phone.dataValues.phone
                model.email = user.dataValues.email
                res.json({
                    code: success,
                    model
                })
            })
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

exports.filterProfessionalsByShift = (req, res) => {
    const { params: { timesheetId }, query: { shift, date } } = req
    SingleTimesheet.findOne({ where: { timesheetId, shift, date } })
    .then(timesheet => {
        res.json({
            code: success,
            timesheet
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

exports.makePayment = (req, res) => {
    const { params: { userId }, body } = req
    Payment.findOne({ where: { userId } })
    .then(payment=> {
        if(payment){
            Payment.update(body, { where: { userId } })
            .then(() => {
                res.json({
                    code: success,
                    response: {
                        title: 'Thank you!',
                        message: paymentReceived
                    }
                })
            })
            .catch(err=> {
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
            body.userId = userId
            Payment.create(body)
            .then(() => {
                res.json({
                    code: success,
                    response: {
                        title: 'Thank you!',
                        message: paymentReceived
                    }
                })
            })
            .catch(err=> {
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
    .catch(err=> {
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