const { hashSync }           = require('bcryptjs')
const { sign }               = require('jsonwebtoken')
const moment                 = require('moment')
const { User, Token }        = require('../models')
const SendEmail              = require('../config/email')

const {
    hostUrl,
    signupSecret,
    tokenExpiration,
    linkExpiration,
    responseMessages: {
        alreadyRegistered,
        emailSent,
        generalErrorMessage,
        linkExpired,
        alreadyVerified,
        linkBroken,
        accountVerified
    },
    codes: {
        error,
        success,
        info
    },
    emailCredentials: {
        emailVerificationSubject,
        emailVerificationMessage
    }
}  = require('../constants')


exports.signup = (req, res) => {
    const { body: { email, password, role } } = req
    User.findOne({ where: { email } })
    .then(user => {
        if(user === null){
            const hashedPassword = hashSync(password, 8)
            const data = {
                email: email.trim(),
                password: hashedPassword,
                role,
                isVerified: false
            }
            User.create(data)
            .then(model => {
                const { id, email } = model
                const authToken = sign({ id }, signupSecret, { expiresIn: tokenExpiration })
                const tokenData = {
                    email: email,
                    token: authToken
                }
                Token.create(tokenData)
                .then(() => {
                    const verificationUrl = `${hostUrl}/${id}/verify/${authToken}`
                    const verificationEmailContent = `${emailVerificationMessage} <a href='${verificationUrl}' target='_blank'>Verify Me</a>`
                    SendEmail(email, emailVerificationSubject, verificationEmailContent)
                    res.json({code: success, response: { title: 'Account Created', message: emailSent } })
                })
                .catch(err => {
                    res.json({code: error, response: { title: 'Error', message: generalErrorMessage }, error: err})
                })
            })
            .catch(err => {
                res.json({ code: error, response: { title: 'Error', message: generalErrorMessage }, error: err })
            })
        }else{
            if(user.dataValues.isVerified){
                res.json({ code: info, response: { title: 'Information', message: alreadyRegistered } })
            }else{
                Token.destroy({ where: { email: user.dataValues.email } })
                const { id, email } = user.dataValues
                const authToken = sign({ id }, signupSecret, { expiresIn: tokenExpiration })
                const tokenData = {
                    email: email,
                    token: authToken
                }
                Token.create(tokenData)
                res.json({ code: success, response: { title: 'Account Created', message: emailSent }  })
            }
        }
    })
    .catch(err => {
        res.json({code: error, response: { title: 'Error', message: generalErrorMessage }, error: err})
    })      
}

exports.verify = (req, res) => {
    const { params: { userId, token } } = req
    User.findOne({ where: { id: userId } })
    .then(user => {
        if(user === null){
            res.json({ code: error, response: linkExpired })
        }else{
            const { dataValues: { isVerified, email } } = user
            if(isVerified){
                res.json({ code: info, response: alreadyVerified })
            }else{
                Token.findOne({ where: { email } })
                .then(userToken => {
                    if(token !== userToken.token){
                        res.json({ code: info, response: linkBroken })
                    }else{
                        const tokenTime = moment(userToken.updatedAt)
                        const currentTime = new moment()
                        const minutes = currentTime.diff(tokenTime, 'minutes')
                        if(minutes > linkExpiration){
                            res.json({ code: error, response: linkExpired })
                        }else{
                            const verifiedUser = {}
                            verifiedUser.isVerified = true
                            User.update(verifiedUser, { where: { id: userId } })
                            .then(() => {
                                Token.destroy({ where: { email } })
                                res.json({ code: success, response: accountVerified, token })
                            })
                            .catch(err => {
                                res.json({code: error, response: generalErrorMessage, error: err})
                            })
                        }
                    }
                })
                .catch(err => {
                    res.json({code: error, response: generalErrorMessage, error: err})
                })
            }
        }
    })
    .catch(err => {
        res.json({code: error, response: generalErrorMessage, error: err})
    })
}