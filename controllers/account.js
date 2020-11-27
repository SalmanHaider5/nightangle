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
const professional = require('../models/professional')

const getProfessionalMailContent = (link, role) => {
    const companyContent = `<div style="background: #f6f5ff; margin: 10 auto; border: 1px dashed #9795ff; width: 90%;">
    <h2 style="color: #0b1586; margin-left: 30px;">
      Welcome to NMC Registered
    </h2>
    <div style="width: 95%; margin: 0 auto;">
      <p>
        If you’re running a Care home, Nursing home or you’re a Director of Nursing for a NHS Trust then…
      </p>
      <p>
        Welcome to NMC Registered the intelligent innovative way to source NMC Professionals. An licence purchase covers your shift needs for the whole year without the need to pay any agency fees.
      </p>
    </div>
    <h4 style="color: #0b1586; margin-left: 30px;">
      Top 7 Reasons To Use NMC Registered?
    </h4>
    <div style="width: 95%; margin: 0 auto;">
      <ul>
        <li>Seamless end to end automated NMC professional sourcing system.</li>
        <li>10.4 shifts cover all your costs for use of licence, then it's free for the rest of the year if you’re paying £3.97 per hour or above to nursing agencies for 12 hour shifts. </li>
        <li>Between 2 to 10-minute completion ratio from sourcing the professional to receiving acceptance of the shift.</li>
        <li>No restrictions on employing professionals full-time or part-time sourced through NMC Registered, unlike many nursing agencies.</li>
        <li>Total security with NMC professional and DBS certificate verification links.</li>
        <li>No budget concerns, fixed fee licensing.</li>
        <li>Use of current pay-cycle mode, no need to adjust pay-cycle run.</li>
      </ul>
    </div>
    <p style="margin-left: 30px;">
      Please click on this button to begin your registration
    </p>
    <div style="width: 100%; text-align: center; margin-bottom: 30px;">
      <a href="${link}" style="background-color: #1890ff; color: #fff; font-weight: bold; padding: 13px; text-decoration: none; font-family:sans-serif; border: none; cursor: pointer;">Verify your Account</a>
    </div>
  </div>`
  const professionalContent = `<div style="background: #f6f5ff; margin: 10 auto; border: 1px dashed #9795ff; width: 90%;">
    <h2 style="color: #0b1586; margin-left: 30px;">
        Welcome to NMC Registered
    </h2>
    <div style="width: 95%; margin: 0 auto;">
        <p>
        As a registered NMC professional or a nursing associate you have huge responsibilities for the care and 
        well-being of your patients. Your efforts are paramount in all arenas of the NHS and the private care 
        sector and as such, deserve recognition. Realising this should mean that the reward for your dedication 
        and hard work should be reflected both financially and with the respect it warrants. NMC Registered will 
        ensure both these objectives.
        </p>
        <p>
        No fees are charged for any shifts or work you do. This allows the care provider to offer higher rates of
        pay directly to the professional. You! Take control of your work schedule. Shifts are sent by text directly
        to your phone and you decide whether to accept or reject the shift offer. Unlike most agencies there is no
        pressure to accept the shift, it’s always your choice. No agency fees are charged, the full rate of pay 
        goes to you. After registration please tell your fellow NMC professionals about our web-service and our ambition
        to ensure that all NMC professionals get paid the true value for their work.
        </p>
    </div>
    <h4 style="color: #0b1586; margin-left: 30px;">
        Get paid your true value.
    </h4>
    <p style="margin-left: 30px;">
        Please click on this button to begin your registration
    </p>
    <div style="width: 100%; text-align: center; margin-bottom: 30px;">
        <a href="${link}" style="background-color: #1890ff; color: #fff; font-weight: bold; padding: 13px; text-decoration: none; font-family:Arial, Helvetica, sans-serif; border: none; cursor: pointer;">Verify your Account</a>
    </div>
    </div>`
    return role === 'professional' ? professionalContent: companyContent
}

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
                    const verificationEmailContent = getProfessionalMailContent(verificationUrl, role)
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
                            if(company){
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
                            }
                        })
                        .catch(err => {
                            console.log('Test4', err)
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
                                                console.log('Test1', err)
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
                                        console.log('Test2', err)
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
                            console.log('Test3', err)
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
        console.log('Test', err)
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
                title: 'Authorization Failed',
                message: tokenInvalid
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