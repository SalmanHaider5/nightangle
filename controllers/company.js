const { Op, Sequelize } = require('sequelize')
const {
    Company,
    User,
    Professional,
    Timesheet,
    SingleTimesheet,
    Payment,
    sequelize
} = require('../models')

const {
    getCompanyPaymentDetails,
    getResponse,
    getGeneralErrorMessage,
    isPasswordValid,
    getHashedPassword,
    getCompanyInitialValues,
    getOffersQuery,
    setCompanyValues,
    getProfessionalPublicAttributes
} = require('./helpers')

const {
    codes:{
        error,
        success,
        info
    },
    responseMessages:{
        recordAdded,
        addRecord,
        recordFound,
        passwordChanged,
        invalidCurrentPassword,
        profileUpdated,
        paymentReceived,
        invalidPassword
    }
} = require('../constants')

exports.add = (req, res) => {
    const { params: { userId }, body } = req
    body.userId = userId
    Company.create(body)
    .then(() => {
        Payment.create(getCompanyPaymentDetails(userId))
        .then(() => {
            const response = getResponse(success, 'Record Added', recordAdded)
            res.json(response)
        })
        .catch(err => {
            console.log('Err2', err)
            const response = getGeneralErrorMessage(err)
            res.json(response)
        })
    })
    .catch(err => {
        console.log('Err1', err)
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}

exports.changePassword = (req, res) => {
    const { params: { userId }, body: { currentPassword, newPassword }, user: { dataValues: { password } } } = req
    if(isPasswordValid(currentPassword, password)){
        User.update({ password: getHashedPassword(newPassword) }, { where: { id: userId } })
        .then(() => {
            const response = getResponse(success, 'Password Reset', passwordChanged)
            res.json(response)
        })
        .catch(err => {
            const response = getGeneralErrorMessage(err)
            res.json(response)
        })
    }else{
        const response = getResponse(error, 'Invalid Password', invalidCurrentPassword)
        res.json(response)
    }
}

exports.getCompanyDetails = (req, res) => {
    const { params: { userId }, user: { dataValues: { email } } } = req
    Company.findOne({ where: { userId } })
    .then(company => {
        if(company){
            const { dataValues } = company
            sequelize.query(getOffersQuery(userId), { type: Sequelize.QueryTypes.SELECT })
            .then(offers => {
                Payment.findOne({ where: { userId } })
                .then(payment => {
                    if(payment){
                        const data = setCompanyValues(dataValues, email, offers, payment.dataValues)
                        const response = getResponse(success, 'Profile Retrieved', recordFound, data)
                        res.json(response)
                    }else{
                        const data = setCompanyValues(dataValues, email, offers)
                        const response = getResponse(success, 'Profile Retrieved', recordFound, data)
                        res.json(response)
                    }
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
            const response = getResponse(info, 'Profile Verified', addRecord, getCompanyInitialValues(email))
            res.json(response)
        }
    })
    .catch(err => {
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}

exports.verifyCompany = (req, res, next) => {
    const { params: { userId } } = req
    Company.findOne({ where: { userId } })
    .then(company => {
        if(company){
            req.company = company
            next();
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

exports.updateCompany = (req, res) => {
    const { params: { userId }, body } = req

    User.findOne({ where: { id: userId } })
    .then(user => {
        const { dataValues } = user
        if(isPasswordValid(body.password, dataValues.password)){
            const { password, ...data } = body
            Company.update(data, { where: { userId } })
            .then(() => {
                const response = getResponse(success, 'Profile Updated', profileUpdated)
                res.json(response)
            })
            .catch(err => {
                const response = getGeneralErrorMessage(err)
                res.json(response)
            })
        }else{
            const response = getResponse(error, 'Invalid Password', invalidPassword)
            res.json(response)
        }
    })
    .catch(err => {
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}

exports.searchProfessionals = (req, res) => {
    const { params: { skill } } = req
    if(skill === 'allSkills'){
        Professional.findAll({ attributes: getProfessionalPublicAttributes() })
        .then(professionals => {
            const response = getResponse(success, '', '', professionals)
            res.json(response)
        })
        .catch(err => {
            const response = getGeneralErrorMessage(err)
            res.json(response)
        })
    }else{
        Professional.findAll({ where: { qualification: skill }, attributes: getProfessionalPublicAttributes() })
        .then(professionals => {
            const response = getResponse(success, '', '', professionals)
            res.json(response)
        })
        .catch(err => {
            const response = getGeneralErrorMessage(err)
            res.json(response)
        })
    }
}

exports.searchTimesheets = (req, res) => {
    const { params: { professionalId, userId } } = req
    Timesheet.findAll({ where: { userId: professionalId } })
    .then(timesheets => {
        const response = getResponse(success, '', '', timesheets)
        res.json(response)
    })
    .catch(err => {
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}

exports.filterProfessionalsByShift = (req, res) => {

    const { params: { timesheetId }, query: { shifts, date } } = req

    SingleTimesheet.findOne({ where: { timesheetId, date, status: 1, shift: {
        [Op.or]: [shifts.split(',')]
    } } })
    .then(timesheet => {
        const response = getResponse(success, '', '', timesheet)
        res.json(response)
    })
    .catch(err => {
        console.log(err)
        const response = getGeneralErrorMessage(err)
        res.json(response)
    })
}

exports.makePayment = (req, res) => {
    const { params: { userId }, body } = req
    Payment.findOne({  where: { userId } })
    .then(payment => {
        if(payment){
            Payment.update(body, { where: { userId } })
            .then(() => {
                const response = getResponse(success, 'Thank you!', paymentReceived)
                res.json(response)
            })
            .catch(err => {
                const response = getGeneralErrorMessage(err)
                res.json(response)
            })
        }else{
            body.userId = userId
            Payment.create(body)
            .then(() => {
                const response = getResponse(success, 'Thank you!', paymentReceived)
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