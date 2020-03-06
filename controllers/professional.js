const { hashSync, compareSync }      = require('bcryptjs')
const moment                         = require('moment')
const randomize                      = require('randomatic')
const { Professional, User, Phone, Timesheet, SingleTimesheet }  = require('../models')
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
        addRecord,
        profileUpdated,
        invalidCurrentPassword,
        timesheetAdded,
        timesheetsFound,
        shiftStatusChanged,
        shiftChanged,
        timesheetDeleted
    }
} = require('../constants')


exports.create = (req, res) => {
    const { params: { userId }, files } = req
    let { body } = req
    if(files && files.document){
        body.document = req.files.document[0].filename
    }
    if(files && files.profilePicture){
        body.profilePicture = req.files.profilePicture[0].filename
    }
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

exports.updateProfessional = (req, res) => {
    const { params: { userId }, body } = req
    console.log('Body', body)
    Professional.findOne({ where: { userId } })
    .then(professional => {
        if(professional === null){
            res.json({
                code: error,
                response: {
                    title: 'Error',
                    message: generalErrorMessage
                },
                error: err
            })
        }else{
            Professional.update(body, { where: { userId } })
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

exports.updateProfessionalSecurityDetails = (req, res) => {
    const { params: { userId }, body: { currentPassword, newPassword, twoFactorAuthentication } } = req
    if(currentPassword === '' || newPassword === ''){
        Professional.findOne({ where: { userId } })
        .then(professional => {
            if(professional === null){
                res.json({
                    code: error,
                    response: {
                        title: 'Error',
                        message: generalErrorMessage
                    }
                })
            }else{
                Professional.update({ twoFactorAuthentication }, { where: { userId } })
                .then(() => {
                    res.json({
                        code: success,
                        response: {
                            title: 'Success',
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
    }else{
        User.findOne({ where: { id: userId } })
        .then(user => {
            if(user){
                const isValid = compareSync(currentPassword, user.dataValues.password)
                if(isValid){
                    const hashedPassword = hashSync(newPassword, 8)
                    User.update({ password: hashedPassword }, { where: { id: userId } })
                    .then(() => {
                        Professional.findOne({ where: { userId } })
                        .then(professional => {
                            if(professional === null){
                                res.json({
                                    code: error,
                                    response: {
                                        title: 'Error',
                                        message: generalErrorMessage
                                    }
                                })
                            }else{
                                Professional.update({ twoFactorAuthentication }, { where: { userId } })
                                .then(() => {
                                    res.json({
                                        code: success,
                                        response: {
                                            title: 'Success',
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
                            const code = randomize('0', 6)
                            const message = `Your verification code is ${code}`
                            SendMessage(phone, message)
                            Phone.update({ phone, code }, { where: { id: data.id } })
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

exports.getPhoneDetails = (req, res) => {
    const { params: { userId } } = req
    Phone.findOne({ where: { userId } })
    .then(phone => {
        res.json(phone)
    })
    .catch(err => {
        res.json(err)
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
                    .then(phone => {
                        const professional = {}
                        if(phone === null){
                            professional.phone = {}
                            professional.picture = {}
                            res.json({ code: info, response: { title: 'Phone Verification', message: phoneVerification }, professional })
                        }else{
                            professional.phone = phone.dataValues
                            professional.picture = {}
                            res.json({ code: info, response: { title: 'Profile Verified', message: addRecord }, professional })
                        }
                    })   
                }else{
                    professional.dataValues.email = user.email
                    professional.dataValues.isVerified = user.isVerified
                    Phone.findOne({ where: { userId } })
                    .then(contact => {
                        professional.dataValues.phone = contact.dataValues
                        professional.picture = {}
                        res.json({ code: success, response: { title: 'Record Found', message: recordFound }, professional })
                    })
                }
            })
        }
    })
}

exports.addTimesheet = (req, res) => {
    const { params: { userId }, body } = req
    const { timesheet, singleTimesheet } = body
    timesheet.userId = userId
    Timesheet.create(timesheet)
    .then(model => {
        const { id } = model
        for(let i = 0; i < singleTimesheet.length; i++){
            singleTimesheet[i].timesheetId = id
            SingleTimesheet.create(singleTimesheet[i])
            .then(() => {
                if(i === singleTimesheet.length - 1){
                    res.json({
                        code: success,
                        response: {
                            title: 'Timesheet Added',
                            message: timesheetAdded
                        }
                    })
                }
            })
            .catch(err => {
                if(i === singleTimesheet.length - 1){
                    res.json({
                        code: error,
                        response: {
                            title: 'Error',
                            message: generalErrorMessage
                        },
                        error: err
                    })
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
            }
        })
    })
}

exports.getSingletimesheet = (req, res) => {
    const { params: { timesheetId } } = req
    SingleTimesheet.findAll({ where: { timesheetId } })
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

exports.getTimesheets = (req, res) => {
    const { params: { userId } } = req
    Timesheet.findAll({ where: { userId } })
    .then(model => {
        res.json({
            code: model.length ? success : info,
            response: {
                title: model.length > 0 ? `${model.length} Timesheet(s) Found` : `No Timesheet Found`,
                message: timesheetsFound
            },
            timesheets: model
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

exports.updateShiftStatus = (req, res) => {
    const { params: { shift, status } } = req
    SingleTimesheet.update({ status }, { where: { id: shift } })
    .then(() => {
        res.json({
            code: success,
            response: {
                title: 'Status Updated',
                message: shiftStatusChanged
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

exports.updateTimesheetShift = (req, res) => {
    const { params: { shiftId }, body } = req
    SingleTimesheet.update(body, { where: { id: shiftId } })
    .then(() => {
        res.json({
            code: success,
            response: {
                title: 'Shift Changed',
                message: shiftChanged
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

exports.deleteTimesheet = (req, res) => {
    const { params: { timesheetId } } = req
    Timesheet.destroy({ where: { id: timesheetId } })
    .then(() => {
        SingleTimesheet.destroy({ where: { timesheetId } })
        .then(() => {
            res.json({
                code: success,
                response: {
                    title: 'Timesheet Deleted',
                    message: timesheetDeleted
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