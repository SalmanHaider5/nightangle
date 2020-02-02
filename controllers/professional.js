const moment                         = require('moment')
const randomize                      = require('randomatic')
const { Professional, User, Phone }  = require('../models')
const SendMessage                    = require('../config/message')

const {
    codeExpiration,
    codes:{
        error,
        success,
        info
    },
    responseMessages:{
        recordAdded,
        generalErrorMessage,
        phoneAdded,
        phoneVerified,
        phoneAlreadyVerified,
        phoneAlreadyUsed,
        falseCode,
        codeExpired,
        recordFound,
        phoneVerification,
        addRecord
    }
} = require('../constants')

exports.create = (req, res) => {
    const { params: { userId }, body } = req
    const professional = body
    professional.userId = userId
    Professional.create(professional)
    .then(() => {
        res.json({ code: success, response:{ title: 'Record Added', message: recordAdded } })
    })
    .catch(err => {
        res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
    })
}

exports.addPhone = (req, res) => {
    const { params: { userId }, body: { phone } } = req
    User.findOne({ where: { id: userId } })
    .then(user => {
        if(user === null){
            res.json({ code: error, response:{ title: 'Not Found', message: generalErrorMessage } })
        }else{
            const { dataValues: { isVerified } } = user
            if(isVerified){
                Phone.findOne({ where: { userId } })
                .then(data => {
                    if(data === null){
                        Phone.findOne({ where: { phone } })
                        .then(model => {
                            if(model === null){
                                const code = randomize('0', 6)
                                const contact = {}
                                contact.phone = phone,
                                contact.code = code
                                contact.status = false
                                contact.userId = userId
                                const message = `Your verification code is ${code}`
                                SendMessage(phone, message)
                                Phone.create(contact)
                                .then(() => {
                                    res.json({ code: success, response: { title: 'Phone Added',  message: phoneAdded } })
                                })
                                .catch(err => {
                                    res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
                                })
                            }else{
                                res.json({ code: error, response: { title: 'Error', message: phoneAlreadyUsed } })
                            }
                        })
                    }
                    else{
                        const { status } = data
                        if(status){
                                res.json({ code: error, response: { title: 'Error', message: phoneAlreadyUsed } })
                        }else{
                            const contact = data.dataValues
                            const phone = contact.phone
                            const code = randomize('0', 6)
                            contact.code = code
                            const message = `Your verification code is ${code}`
                            SendMessage(phone, message)
                            Phone.update(contact, { where: { id: data.id } })
                            .then(() => {
                                res.json({ code: success, response: { title: 'Phone Added',  message: phoneAdded } })
                            })
                            .catch(err => {
                                res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
                            })
                        }
                    }
                })
            }else{
                res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage } })
            }
        }
    })
}

exports.verifyPhone = (req, res) => {
    const { params: { userId }, body: { code } } = req
    Phone.findOne({ where: { userId: userId } })
    .then(model => {
        if(model === null){
            res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
        }else{
            const { dataValues } = model
            console.log('Matching...', code, dataValues.code)
            if(dataValues.code === code){
                const codeTime = moment(model.updatedAt)
                
                const currentTime = new moment()
                const minutes = currentTime.diff(codeTime, 'minutes')
                if(minutes > codeExpiration){
                    res.json({ code: error, response: { title: 'Code Expired', message: codeExpired } })
                }else{
                    if(dataValues.status){
                        res.json({ code: error, response: { title: 'Error', message: phoneAlreadyVerified } })
                    }else{
                        const contact = dataValues
                        contact.status = true
                        Phone.update(contact, { where: { userId } })
                        .then(() => {
                            res.json({ code: success, response: { title: 'Phone Verified', message: phoneVerified } })
                        })
                        .catch(err => {
                            res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
                        })
                    }
                }
            }else{
                res.json({ code: error, response:{ title: 'Error', message: falseCode } })
            }
        }
    })
    .catch(err => {
        res.json({ code: error, response:{ title: 'Error', message: generalErrorMessage }, error: err })
    })
}

exports.getProfessionalDetails = (req, res) => {
    const { params: { userId } } = req
    User.findOne({ where: { id: userId, isVerified: true } })
    .then(user => {
        if(user === null){
            res.json({ code: error, response: { title: 'Not Found', message: noRecord } })
        }else{
            Professional.findOne({ where: { userId } })
            .then(professional => {
                if(professional === null){
                    Phone.findOne({ where: { userId, status: true } })
                    .then((phone) => {
                        if(phone === null){
                            res.json({ code: info, response: { title: 'Phone Verification', message: phoneVerification }, codeType: 1 })
                        }else{
                            res.json({ code: info, response: { title: 'Profile Verified', message: addRecord }, codeType: 2 })
                        }
                    })   
                }else{
                    res.json({ code: success, response: { title: 'Record Found', message: recordFound }, professional, codeType: 0 })
                }
            })
        }
    })
}