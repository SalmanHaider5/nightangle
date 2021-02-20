const { verify }  = require('jsonwebtoken')
const SendEmail   = require('../config/email')
const SendMessage = require('../config/message')

const {
    User,
    Token,
    Professional,
    Phone,
    Payment
} = require('../models')

const {
    getResponse,
    getGeneralErrorMessage,
    getEmailContent,
    getUserToken,
    getUserData,
    isActivationLinkExpired,
    isPasswordValid,
    getBasicProfessionalData,
    getRandomCode,
    getBasicCompanyData,
    getHashedPassword,
    getPasswordSuccessEmailContent
} = require('./helpers')

const {
    signupSecret,
    responseMessages: {
        alreadyRegistered,
        emailSent,
        linkExpired,
        alreadyVerified,
        linkBroken,
        accountVerified,
        userNotFound,
        userNotVerified,
        invalidPassword,
        loginSuccess,
        codeExpired,
        tokenInvalid,
        passwordResetLinkSent,
        passwordChangeSuccess,
        falseCode,
        accessDenied,
        phoneVerification
    },
    codes: {
        error,
        success,
        info
    }
}  = require('../constants')

exports.signup = (req, res) => {
    const { body: { email, password, role } } = req
    User.findOne({ where: { email } })
    .then(user => {
        if(user){
            const { dataValues: { isVerified } } = user
            if(isVerified){
                const response = getResponse(info, 'Account Exists', alreadyRegistered)
                res.json(response)
            }else{
                const { dataValues: { role: userRole } } = user
                const { dataValues: { id } } = user
                const userToken = getUserToken(email, id)
                Token.update(userToken, { where: { email } })
                .then(() => {
                    const { token } = userToken
                    const emailData = getEmailContent(id, email, token, role)
                    SendEmail(emailData)
                    if(userRole === role){
                        const response = getResponse(success, 'Email Resent', emailSent)
                        res.json(response)
                    }else{
                        const userData = getUserData(email, password, role)
                        User.update(userData, { where: { email } })
                        .then(() => {
                            const response = getResponse(success, 'Check you Email', emailSent)
                            res.json(response)
                        })
                        .catch(err => {
                            const response = getGeneralErrorMessage(err)
                            res.json(response)
                        })
                    }
                })
                .catch(err => {
                    const response = getGeneralErrorMessage(err)
                    res.json(response)
                })
            }
        }else{
            const userData = getUserData(email, password, role)
            User.create(userData)
            .then(model => {
                const { id } = model
                const userToken = getUserToken(email, id)
                Token.create(userToken)
                .then(() => {
                    const { token } = userToken
                    const emailData = getEmailContent(id, email, token, role)
                    const response = getResponse(success, 'Check you Email', emailSent)
                    SendEmail(emailData)
                    res.json(response)
                })
                .catch(err => {
                    const response = getGeneralErrorMessage(err)
                    res.json(response)
                })
            })
            .catch(err => {
                const response = getGeneralErrorMessage(err)
                res.json(response)
            })
        }
    })
    .catch(err => {
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })      
}

exports.verify = (req, res) => {
    const { params: { userId, token: reqToken } } = req
    User.findOne({ where: { id: userId } })
    .then(user => {
        if(user){
            const { dataValues: { isVerified, email, role } } = user
            if(isVerified){
                const response = getResponse(info, 'User already Verified', alreadyVerified)
                res.json(response)
            }else{
                Token.findOne({ where: { email } })
                .then(userToken => {
                    const { dataValues: { token, updatedAt } } = userToken
                    if(token === reqToken){
                        if(isActivationLinkExpired(updatedAt)){
                            const response = getResponse(error, 'Activation Expired', linkExpired)
                            res.json(response)
                        }else{
                            const verifiedUser = {}
                            verifiedUser.isVerified = true
                            User.update(verifiedUser, { where: { id: userId } })
                            .then(() => {
                                Token.destroy({ where: { email } })
                                .then(() => {
                                    const data = { auth: true, token, userId, role, email }
                                    const response = getResponse(success, 'Account Verified', accountVerified, data)
                                    res.json(response)
                                })
                                .catch(err => {
                                    const response = getGeneralErrorMessage(err)
                                    res.json(response)
                                })
                            })
                            .catch(err => {
                                const response = getGeneralErrorMessage(err)
                                res.json(response)
                            })
                        }
                    }else{
                        const response = getResponse(error, 'Inavlid Token', linkBroken)
                        res.json(response)
                    }
                })
            }
        }else{
            const response = getResponse(error, 'User not Found', userNotFound)
            res.json(response)
        }

    })
    .catch(err => {
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}

exports.getUserByEmail = (req, res, next) => {
    const { body: { email } } = req
    User.findOne({ where: { email } })
    .then(user => {
        if(user){
            const { dataValues: { isVerified } } = user
            if(isVerified){
                req.user = user
                next();
            }else{
                const response = getResponse(error, 'Account not Verified', userNotVerified)
                res.json(response)
            }
        }else{
            const response = getResponse(error, 'User not Found', userNotFound)
            res.json(response)
        }
    })
    .catch(err => {
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}


exports.login = (req, res) => {
    const { body: { email, password: reqPassword }, user } = req
    const { dataValues: { id, password, role } } = user
    if(isPasswordValid(reqPassword, password)){
        if(role === 'company'){
            const data = getBasicCompanyData(id, email, role)
            const response = getResponse(success, 'Login Success', loginSuccess, data)
            res.json(response)
        }else if(role === 'professional'){
            Professional.findOne({ where: { userId: id } })
            .then(professional => {
                const { dataValues = {} } = professional || {}
                const { twoFactorAuthentication } = dataValues
                if(professional && twoFactorAuthentication){
                    Phone.findOne({ where: { userId: id } })
                    .then(userPhone => {
                        const { dataValues: { phone } } = userPhone
                        const code = getRandomCode()
                        const message = `Your verification code is ${code}`
                        SendMessage(phone, message)
                        Phone.update({ code }, { where: { userId: id } })
                        .then(() => {
                            const data = { userId: id, email, role, twoFactorAuthentication }
                            const response = getResponse(info, 'Mobile Verification Required', phoneVerification, data)
                            res.json(response)
                        })
                        .catch(err => {
                            const response = getGeneralErrorMessage(err)
                            res.json(response)
                        })
                    })
                    .catch(err => {
                        const response = getGeneralErrorMessage(err)
                        res.json(response)
                    })
                }else{
                    const data = getBasicProfessionalData(id, email, role)
                    const response = getResponse(success, 'Login Success', loginSuccess, data)
                    res.json(response)
                }
            })
            .catch(err => {
                const response = getGeneralErrorMessage(err)
                res.json(response)
            })
        }else{
            const response = getGeneralErrorMessage({})
            res.json(response)
        }
    }else{
        const response = getResponse(error, 'Invalid Password', invalidPassword)
        res.json(response)
    }
}

exports.verifyLogin = (req, res) => {
    const { body: { professionalId, code: reqCode }, user } = req
    Phone.findOne({ where: { userId: professionalId } })
    .then(phone => {
        if(phone){
            const { code = '', updatedAt, phone: userPhone } = phone
            if(code === reqCode){
                const isCodeExpired = isActivationLinkExpired(updatedAt, 'code')
                if(isCodeExpired){
                    const response = getResponse(error, 'Code Expired', codeExpired)
                    res.json(response)
                }else{
                    const { dataValues: { email, role } } = user
                    const data = getBasicProfessionalData(professionalId, email, role, true)
                    const response = getResponse(success, 'Login Success', loginSuccess, data)
                    res.json(response)
                }
            }else{
                const response = getResponse(error, 'Invalid Code', falseCode)
                res.json(response)
            }
        }else{
            const response = getGeneralErrorMessage({})
            res.json(response)
        }
    })
    .catch(err => {
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}

exports.verifyToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization']
    if(token){
        verify(token, signupSecret, (err, decoded) => {
            if(err){
                const response = getResponse(error, 'Authorization Failed', tokenInvalid, [], err)
                res.json(response)
            }else{
                req.decoded = decoded
                next();
            }
        })
    }else{
        const response = getResponse(error, 'Unauthorized Request', tokenInvalid)
        res.json(response)
    }
}

exports.sendPasswordResetLink = (req, res) => {
    const { user: { dataValues: { id, email } } } = req
    const { token } = getUserToken(email, id)
    const emailData = getEmailContent(id, email, token, '', 'password-reset')
    const response = getResponse(success, 'Email Sent', passwordResetLinkSent)
    SendEmail(emailData)
    res.json(response)
}

exports.resetPassword = (req, res) => {
    const { body: { password }, params: { userId }, user: { dataValues: { email } } } = req
    User.update({ password: getHashedPassword(password) }, { where: { id: userId } })
    .then(() => {
        const emailData = getPasswordSuccessEmailContent(email)
        const response = getResponse(success, 'Password Change Success', passwordChangeSuccess)
        SendEmail(emailData)
        res.json(response)
    })
    .catch(err => {
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}

exports.verifyUser = (req, res, next) => {
    const { params: { userId } } = req
    User.findOne({ where: { id: userId } })
    .then(user => {
        if(user){
            const { dataValues: { isVerified } } = user
            if(isVerified){
                req.user = user
                next();
            }else{
                const response = getResponse(error, 'Account not Verified', userNotVerified)
                res.json(response)
            }
        }else{
            const response = getResponse(error, 'Invalid Request', userNotFound)
            res.json(response)
        }
    })
    .catch(err => {
        console.log(err)
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}

exports.verifyPayment = (req, res, next) => {
    const { params: { userId } } = req
    Payment.findOne({ where: { userId, status: true } })
    .then(payment => {
        if(payment){
            console.log('Here verified')
            next();
        }else{
            const response = getResponse(error, 'Access Denied', accessDenied)
            res.json(response)
        }
    })
    .catch(err => {
        console.log('err', err)
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}