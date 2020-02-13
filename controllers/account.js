const { hashSync, compareSync } = require('bcryptjs')
const { sign }                  = require('jsonwebtoken')
const moment                    = require('moment')
const { User, Token }           = require('../models')
const SendEmail                 = require('../config/email')

const {
    appUrl,
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
        accountVerified,
        userNotFound,
        userNotVerified,
        invalidPassword
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
                    const verificationUrl = `${appUrl}/${id}/verify/${authToken}`
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
                const verificationUrl = `${appUrl}/${id}/verify/${authToken}`
                const verificationEmailContent = `${emailVerificationMessage} <a href='${verificationUrl}' target='_blank'>Verify Me</a>`
                SendEmail(email, emailVerificationSubject, verificationEmailContent)
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
            res.json({ code: error, response: { title: 'User not Found', message: generalErrorMessage } })
        }else{
            const { dataValues: { isVerified, email } } = user
            if(isVerified){
                res.json({ code: info, response: { title: 'Already Verified', message: alreadyVerified } })
            }else{
                Token.findOne({ where: { email } })
                .then(userToken => {
                    if(token !== userToken.token){
                        res.json({ code: error, response: { title: 'Link Broken', message: linkBroken } })
                    }else{
                        const tokenTime = moment(userToken.updatedAt)
                        const currentTime = new moment()
                        const minutes = currentTime.diff(tokenTime, 'minutes')
                        if(minutes > linkExpiration){
                            res.json({ code: error, response: { title: 'Link Expired', message: linkExpired } })
                        }else{
                            const verifiedUser = {}
                            verifiedUser.isVerified = true
                            User.update(verifiedUser, { where: { id: userId } })
                            .then(() => {
                                Token.destroy({ where: { email } })
                                res.json({ code: success, response: { title: 'Account Verified', message: accountVerified }, token, role: user.role })
                            })
                            .catch(err => {
                                res.json({code: error, response: { title: 'Error', message: generalErrorMessage }, error: err})
                            })
                        }
                    }
                })
                .catch(err => {
                    res.json({code: error, response: { title: 'Error', message: generalErrorMessage }, error: err})
                })
            }
        }
    })
    .catch(err => {
        res.json({code: error, response: { title: 'Error', message: generalErrorMessage }, error: err})
    })
}

exports.login = (req, res) => {
    const { body: { email, password } } = req
    User.findOne({ where: { email } })
    .then(user =>{
        if(user === null){
            res.json({code: error, response: { title: 'Account not Found', message: userNotFound }, error: err})
        }else{
            const { dataValues: { isVerified } } = user
            if(isVerified){
                const isValid = compareSync(password, user.dataValues.password)
                if(isValid){
                    const authToken = sign({ id }, signupSecret, { expiresIn: tokenExpiration })
                    //Need to add code here
                }else{
                    res.json({code: error, response: { title: 'Invalid Password', message: invalidPassword }, error: err})
                }
            }else{
                res.json({code: error, response: { title: 'Account not Verified', message: userNotVerified }, error: err})
            }
        }
    })
    .catch(err => {
        res.json({code: error, response: { title: 'Error', message: generalErrorMessage }, error: err})
    })
}