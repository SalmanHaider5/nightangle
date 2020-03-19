const { hashSync, compareSync }                     = require('bcryptjs')
const { sign, verify }                              = require('jsonwebtoken')
const moment                                        = require('moment')
const randomize                                     = require('randomatic')
const { User, Token, Professional, Company, Phone } = require('../models')
const SendEmail                                     = require('../config/email')
const SendMessage                                   = require('../config/message')

const {
    appUrl,
    signupSecret,
    tokenExpiration,
    codeExpiration,
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
        invalidPassword,
        loginSuccess,
        phoneAdded,
        codeExpired,
        tokenInvalid,
        passwordResetLinkSent,
        passwordChangeSuccess,
        falseCode
    },
    codes: {
        error,
        success,
        info
    },
    emailCredentials: {
        emailVerificationSubject,
        emailVerificationMessage,
        resetPasswordMessage,
        resetPasswordSubject
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
                    const verificationUrl = `${appUrl}${id}/verify/${authToken}`
                    const verificationEmailContent = `${emailVerificationMessage} <a href='${verificationUrl}' target='_blank'>Verify Me</a>`
                    SendEmail(email, emailVerificationSubject, verificationEmailContent)
                    res.json({
                        code: success,
                        response: {
                            title: 'Account Created',
                            message: emailSent
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
        }else{
            if(user.dataValues.isVerified){
                res.json({
                    code: info,
                    response: {
                        title: 'Information',
                        message: alreadyRegistered
                    }
                })
            }else{
                Token.destroy({ where: { email: user.dataValues.email } })
                const { id, email } = user.dataValues
                const authToken = sign({ id }, signupSecret, { expiresIn: tokenExpiration })
                const tokenData = {
                    email: email,
                    token: authToken
                }
                Token.create(tokenData)
                const verificationUrl = `${appUrl}${id}/verify/${authToken}`
                const verificationEmailContent = `${emailVerificationMessage} <a href='${verificationUrl}' target='_blank'>Verify Me</a>`
                SendEmail(email, emailVerificationSubject, verificationEmailContent)
                res.json({
                    code: success,
                    response: {
                        title: 'Account Created',
                        message: emailSent
                    } 
                })
            }
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

exports.verify = (req, res) => {
    const { params: { userId, token } } = req
    User.findOne({ where: { id: userId } })
    .then(user => {
        if(user === null){
            res.json({
                code: error,
                response: {
                    title: 'User not Found',
                    message: generalErrorMessage
                }
            })
        }else{
            const { dataValues: { isVerified, email } } = user
            if(isVerified){
                res.json({
                    code: info,
                    response: {
                        title: 'Already Verified',
                        message: alreadyVerified
                    }
                })
            }else{
                Token.findOne({ where: { email } })
                .then(userToken => {
                    if(token !== userToken.token){
                        res.json({
                            code: error,
                            response: {
                                title: 'Link Broken',
                                message: linkBroken
                            }
                        })
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
                                res.json({
                                    code: success,
                                    response: {
                                        title: 'Account Verified',
                                        message: accountVerified
                                    },
                                    token,
                                    userId: user.id,
                                    role: user.role
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

exports.login = (req, res) => {
    const { body: { email, password } } = req
    User.findOne({ where: { email } })
    .then(user =>{
        if(user === null){
            res.json({
                code: error,
                response: {
                    title: 'Account not Found',
                    message: userNotFound
                }
            })
        }else{
            const { dataValues: { isVerified, role, id } } = user
            if(isVerified){
                const isValid = compareSync(password, user.dataValues.password)
                if(isValid){
                    if(role === 'company'){
                        Company.findOne({ where: { userId: id } })
                        .then(company => {
                            const authToken = sign({ id }, signupSecret, { expiresIn: tokenExpiration })
                            res.json({
                                code: 'success',
                                response: {
                                    title: 'Login Success',
                                    message: loginSuccess
                                },
                                userId: id,
                                role,
                                token: authToken
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
                    else if(role === 'professional'){
                        Professional.findOne({ where: { userId: id } })
                        .then(professional => {
                            if(professional){
                                const { twoFactorAuthentication } = professional
                                if(twoFactorAuthentication){
                                    Phone.findOne({ where: { userId: id } })
                                    .then(userPhone => {
                                        if(userPhone){
                                            const code = randomize('0', 6)
                                            const message = `Your verification code is ${code}`
                                            SendMessage(userPhone.phone, message)
                                            Phone.update({ code }, { where: { userId: id } })
                                            .then(() => {
                                                res.json({
                                                    code: info,
                                                    response: {
                                                        title: 'Mobile Verification Required',
                                                        message: phoneAdded
                                                    },
                                                    twoFactorAuthenticationEnabled: true,
                                                    role,
                                                    userId: id
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
                                }else{
                                    const authToken = sign({ id }, signupSecret, { expiresIn: tokenExpiration })
                                    res.json({
                                        code: 'success',
                                        response: {
                                            title: 'Login Success',
                                            message: loginSuccess
                                        },
                                        userId: id,
                                        twoFactorAuthentication: false,
                                        role,
                                        token: authToken
                                    })
                                }
                            }else{
                                const authToken = sign({ id }, signupSecret, { expiresIn: tokenExpiration })
                                res.json({
                                    code: 'success',
                                    response: {
                                        title: 'Login Success',
                                        message: loginSuccess
                                    },
                                    userId: id,
                                    twoFactorAuthentication: false,
                                    role,
                                    token: authToken
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
                }else{
                    res.json({
                        code: error,
                        response:{
                            title: 'Invalid Password',
                            message: invalidPassword
                        }
                    })
                }
            }else{
                res.json({
                    code: error,
                    response:{
                        title: 'Account not Verified',
                        message: userNotVerified
                    }
                })
            }
        }
    })
    .catch(err => {
        res.json({
            code: error,
            response:{
                title: 'Error',
                message: generalErrorMessage
            },
            error: err
        })
    })
}

exports.verifyLogin = (req, res) => {
    const { body: { professionalId, code } } = req
    Phone.findOne({ where: { userId: professionalId } })
    .then(phone => {
        if(phone.code === code){
            const codeTime = moment(phone.updatedAt)
            const currentTime = new moment()
            const minutes = currentTime.diff(codeTime, 'minutes')
            if(minutes > codeExpiration){
                res.json({
                    code: error,
                    response: {
                        title: 'Code Expired',
                        message: codeExpired
                    }
                })
            }else{
                const authToken = sign({ id: professionalId }, signupSecret, { expiresIn: tokenExpiration })
                res.json({
                    code: 'success',
                    response: {
                        title: 'Login Success',
                        message: loginSuccess
                    },
                    token: authToken,
                    userId: professionalId,
                    role: 'professional'
                })
            }
        }else{
            res.json({
                code: error,
                response: {
                    title: 'Invalid Code',
                    message: falseCode
                }
            })
        }
    })
    .catch(err => {
        console.log(err)
        res.json({
            code: error,
            response:{
                title: 'Error',
                message: generalErrorMessage
            },
            error: err
        })
    })
}

exports.verifyToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization']
    if(token){
        verify(token, signupSecret, (err, decoded) => {
            if(err){
                res.json({
                    code: error,
                    response: {
                        title: 'Authorization Failed',
                        message: tokenInvalid
                    },
                    error: err
                })
            }else{
                req.decoded = decoded
                next();
            }
        })
    }else{
        res.json({
            code: error,
            response: {
                title: 'Error',
                message: generalErrorMessage
            }
        })
    }
}

exports.sendPasswordResetLink = (req, res) => {
    const { body: { email } } = req
    User.findOne({ where: { email } })
    .then(user => {
        if(user === null){
            res.json({
                code: error,
                response: {
                    title: 'Account Not Found',
                    message: userNotFound
                }
            })
        }else{
            const authToken = sign({ id: user.id }, signupSecret, { expiresIn: tokenExpiration })
            const passwordResetUrl = `${appUrl}${user.id}/resetPassword/${authToken}`
            const passwordResetContent = `${resetPasswordMessage} <a href='${passwordResetUrl}' target='_blank'>Reset Password</a>`
            SendEmail(email, resetPasswordSubject, passwordResetContent)
            res.json({
                code: success,
                response: {
                    title: 'Email Sent',
                    message: passwordResetLinkSent
                }
            })
        }
    })
    .catch(err => {
        console.log(err)
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

exports.resetPassword = (req, res) => {
    const { body: { password }, params: { userId } } = req
    User.findOne({ where: { id: userId } })
    .then(user => {
        if(user === null){
            res.json({
                code: error,
                response: {
                    title: 'Invalid Request',
                    message: generalErrorMessage
                }
            })
        }else{
            const hashedPassword = hashSync(password, 8)
            User.update({ password: hashedPassword }, { where: { id: userId } })
            .then(() => {
                SendEmail(user.email, 'Password Reset Success', passwordChangeSuccess)
                res.json({
                    code: success,
                    response: {
                        title: 'Password Change Success',
                        message: passwordChangeSuccess
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