const { sign }                   = require('jsonwebtoken')
const { hashSync, compareSync }  = require('bcryptjs')
const randomize                  = require('randomatic')
const moment                     = require('moment')
const {
    appUrl,
    signupSecret,
    tokenExpiration,
    codeExpiration,
    linkExpiration,
    responseMessages: { generalErrorMessage, passwordChangeSuccess },
    codes: { error },
    emailCredentials: { emailVerificationSubject, resetPasswordSubject },
    stripeCredentials: { amount, vatPercent }
} = require('../constants')

exports.getResponse = (type, title, text, data = [], error = {}) => {
    return {
        type,
        message: {
            title,
            text
        },
        data,
        error
    }
}

exports.getGeneralErrorMessage = error => {
    return {
        type: 'error',
        message: {
            title: 'Error',
            text: generalErrorMessage
        },
        data: [],
        error
    }
}

exports.isActivationLinkExpired = (updatedTime, type='link') => {
    const tokenTime = moment(updatedTime)
    const currentTime = new moment()
    const linkTime = currentTime.diff(tokenTime, 'minutes')
    return type === 'link' ? linkTime > linkExpiration : linkTime > codeExpiration
}

exports.isPasswordValid = (reqPassword, password) => {
    return compareSync(reqPassword, password)
}

exports.getEmailContent = (id, email, token, role, type='signup') => {
    const verificationUrl = type === 'signup' ? `${appUrl}/${id}/verify/${token}` : `${appUrl}${id}/resetPassword/${token}`
    return {
        to: email,
        subject: type === 'signup' ? emailVerificationSubject : resetPasswordSubject,
        content: type === 'signup' ? getSignupMailContent(verificationUrl, role) : getPasswordResetContent(verificationUrl)
    }
}

exports.getPasswordSuccessEmailContent = email => {
    return {
        to: email,
        subject: 'Password Successfully Reset [NMC Professionals]',
        content: getPasswordChangeSuccessContent()
    }
}

exports.getContactEmailContent = (name, phone, email, subject, message) => {
    const content = getContactMessagesContent(name, phone, email, message)
    return {
        to: 'malhughes@fastmail.com',
        subject,
        content
    }
}

exports.setNewOffer = (professional, offer) => {
    const { nmcPin: professionalNmc, fullName: professionalName } = professional
    return { ...offer, professionalName, professionalNmc }
}

exports.getNewOfferMessage = (id, address) => {
    return `Hello, you have a new shift offer from NMC Professionals at ${address}. Please click this link to view offer: ${appUrl}professional/${id}/requests`
}

exports.getBasicProfessionalData = (id, email, role, twoFactorAuth = false) => {
    const authToken = sign({ id }, signupSecret)
    return {
        userId: id,
        role,
        email,
        auth: true,
        token: authToken,
        twoFactorAuthentication: twoFactorAuth
    }
}

exports.getBasicCompanyData = (id, email, role) => {
    const authToken = sign({ id }, signupSecret, { expiresIn: tokenExpiration })
    return {
        auth: true,
        userId: id,
        role,
        email,
        token: authToken
    }
}

exports.getTwoFactorAuthTitle = twoFactorAuthentication =>{
    return twoFactorAuthentication ? '2FA Enabled' : '2FA Disabled'
}

exports.setPhoneInitialValues = (userId, code, phone) => {
    return {
        phone, code, status: false, userId
    }
}

exports.setProfessionalBody = (userId, files, body) => {
    return {
        ...body,
        userId,
        profilePicture: files && files.profilePicture ? files && files.profilePicture[0].filename : ''
    }
}

exports.getRandomCode = () => {
    return randomize('0', 6)
}

exports.getCompanyPaymentDetails = id => {
    return {
        balance: amount,
        payDate: null,
        vat: vatPercent,
        status: false,
        userId: id
    }
}

exports.getUserToken = (email, id) => {
    const authToken = sign({ id }, signupSecret, { expiresIn: tokenExpiration })
    return { email, token: authToken }
}

exports.getUserData = (email, password, role) => {
    const hashedPassword = hashSync(password, 8)
    return {
        email: email.trim(),
        password: hashedPassword,
        role,
        isVerified: false
    }
}

exports.getHashedPassword = password => {
    return hashSync(password, 8)
}

exports.getCompanyInitialValues = email => {
    return {
        email,
        offers: [],
        payDate: '',
        isVerified: true,
        isPaid: false,
        balance: amount,
        vat: vatPercent,
        location: false
    }
}

exports.verifyLocation = (longitude, latitude, dataValues) => {

    const minLongitude = parseFloat(dataValues.longitude) - 0.500
    const maxLongitude = parseFloat(dataValues.longitude) + 0.500
    const minLatitude = parseFloat(dataValues.latitude) - 0.500
    const maxLatitude = parseFloat(dataValues.latitude) + 0.500

    if((longitude < maxLongitude && longitude > minLongitude) && (latitude < maxLatitude && latitude > minLatitude))
        return true
    else
        return false
}

exports.setProfessionalInitialValues = (user, phoneInfo, bankDetails = {}, professional = {}, offers = []) => {
    console.log('Data', offers)
    const { phone = '', status = false } = phoneInfo
    const { email = '', isVerified = false } = user
    return {
        phone, phoneStatus: status, bankDetails, email, isVerified, ...professional, offers
    }
}

exports.getTimesheetsTitleMessage = length => {
    return length > 0 ? `${length} timesheets Exists` : 'No timesheet found'
}

exports.setCompanyValues = (model, email, offers, payment) => {
    const { status = false, payDate = '', balance = amount, vat = vatPercent } = payment || {}
    return { ...model, email, offers, isPaid: status, balance, vat, isVerified: true, payDate }
}

exports.equals = (a, b) => {
    return a === b
}

exports.isTimesheetExpired = date => {
    return moment(date).isBefore(moment())
}

exports.getProfessionalPublicAttributes = () => {
    return ['status', 'profilePicture', 'fullName', 'dateOfBirth', 'nmcPin', 'qualification', 'postCode', 'crbDocument', 'userId']
}

exports.getOffersQuery = id => {
    return `SELECT offers.id, offers.professional, offers.shiftRate, offers.shifts, offers.message, offers.status,
        (SELECT fullName from professionals WHERE userId=offers.professional) as professionalName,
        (SELECT nmcPin from professionals WHERE userId=offers.professional) as professionalNmc
        FROM offers
        WHERE company=${id}`
}

exports.getProfessionalOffersQuery = id => {
    return `SELECT offers.id, offers.company, offers.shiftRate, offers.shifts, offers.address, offers.message, offers.status,
        (SELECT organization from companies WHERE userId=offers.company) as companyName
        FROM offers
        WHERE professional=${id}`
}

exports.getOfferStatusMessage = (status, professionalId = '') => {
    const accepted = `Hello, the NMC professional has accepted your shift offer, please confirm your acceptance via the “Approval” button on your NMC Professionals account.`
    const declined = `Hello, the requested NMC professional has requested to be excused on this occasion and sends their apologies, sorry.`
    const approved = `Your shift is confirmed by NMC Company, hope you have a good shift. Details are here: ${appUrl}professional/${professionalId}/requests`
    const rejected = `Oops! Offered shift by NMC Professionals has now been filled by someone else. Offers normally work on a first come first serve basis, sorry this time next time will be better.`
    if(status === 'accepted') return accepted
    else if(status === 'declined') return declined
    else if(status === 'approved') return approved
    else if(status === 'rejected') return rejected
}

const getSignupMailContent = (url, role) => {
    const companyContent = `<div style="background: #f6f5ff; margin: 10 auto; border: 1px dashed #9795ff; width: 90%;">
    <h2 style="color: #0b1586; margin-left: 30px;">
      Welcome to NMC Professionals
    </h2>
    <div style="width: 95%; margin: 0 auto;">
      <p>
        If you’re running a Care home, Nursing home or you’re a Director of Nursing for a NHS Trust then…
      </p>
      <p>
        Welcome to NMC Professionals the intelligent innovative way to source NMC Professionals. An licence purchase covers your shift needs for the whole year without the need to pay any agency fees.
      </p>
    </div>
    <h4 style="color: #0b1586; margin-left: 30px;">
      Top 7 Reasons To Use NMC Professionals?
    </h4>
    <div style="width: 95%; margin: 0 auto;">
      <ul>
        <li>Seamless end to end automated NMC professional sourcing system.</li>
        <li>10.4 shifts cover all your costs for use of licence, then it's free for the rest of the year if you’re paying £3.97 per hour or above to nursing agencies for 12 hour shifts. </li>
        <li>Between 2 to 10-minute completion ratio from sourcing the professional to receiving acceptance of the shift.</li>
        <li>No restrictions on employing professionals full-time or part-time sourced through NMC Professionals, unlike many nursing agencies.</li>
        <li>Total security with NMC professional and DBS certificate verification links.</li>
        <li>No budget concerns, fixed fee licensing.</li>
        <li>Use of current pay-cycle mode, no need to adjust pay-cycle run.</li>
      </ul>
    </div>
    <p style="margin-left: 30px;">
      Please click on this button to begin your registration
    </p>
    <div style="width: 100%; text-align: center; margin-bottom: 30px;">
      <a href="${url}" style="background-color: #1890ff; color: #fff; font-weight: bold; padding: 13px; text-decoration: none; font-family:sans-serif; border: none; cursor: pointer;">Verify your Account</a>
    </div>
  </div>`;

  const professionalContent = `<div style="background: #f6f5ff; margin: 10 auto; border: 1px dashed #9795ff; width: 90%;">
        <h2 style="color: #0b1586; margin-left: 30px;">
            Welcome to NMC Professionals
        </h2>
        <div style="width: 95%; margin: 0 auto;">
            <p>
            As a registered NMC professional or a nursing associate you have huge responsibilities for the care and 
            well-being of your patients. Your efforts are paramount in all arenas of the NHS and the private care 
            sector and as such, deserve recognition. Realising this should mean that the reward for your dedication 
            and hard work should be reflected both financially and with the respect it warrants. NMC Professionals will 
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
            <a href="${url}" style="background-color: #1890ff; color: #fff; font-weight: bold; padding: 13px; text-decoration: none; font-family:Arial, Helvetica, sans-serif; border: none; cursor: pointer;">Verify your Account</a>
        </div>
    </div>`;
    return role === 'professional' ? professionalContent: companyContent
}

const getPasswordResetContent = url => {
    const emailContent = `<div style="background: #f6f5ff; margin: 10 auto; border: 1px dashed #9795ff; width: 90%;">
        <h2 style="color: #0b1586; margin-left: 30px;">
        Password Reset Request
        </h2>
        <div style="width: 95%; margin: 0 auto;">
        
        <p>
            Welcome to NMC Professionals the intelligent innovative way to source NMC Professionals. An licence purchase covers your shift needs for the whole year without the need to pay any agency fees.
        </p>
        </div>
        <p style="margin-left: 30px;">
        Please click on this button to reset your password
        </p>
        <div style="width: 100%; text-align: center; margin-bottom: 30px;">
        <a href="${url}" style="background-color: #1890ff; color: #fff; font-weight: bold; padding: 13px; text-decoration: none; font-family:sans-serif; border: none; cursor: pointer;">Reset your Password</a>
        </div>
    </div>`;
    return emailContent
}

const getPasswordChangeSuccessContent = () => {
    return `<div style="background: #f6f5ff; margin: 10 auto; border: 1px dashed #9795ff; width: 90%;">
        <h2 style="color: #0b1586; margin-left: 30px;">
        Password Reset Request Success
        </h2>
        <div style="width: 95%; margin: 0 auto;">
        <p>
            ${passwordChangeSuccess}
        </p>
        </div>
    </div>`
}

const getContactMessagesContent = (name, phone, email, message) => {
    return `<div style="background: #f6f5ff; margin: 10 auto; border: 1px dashed #9795ff; width: 70%;">
        <h2 style="color: #0b1586; margin-left: 30px;">
        NMC Professionals Message
        </h2>
        <div style="width: 95%; margin: 0 auto;">
        <h4>
            <u>Sender's Information</u>
        </h4>
        <p><strong>Name: </strong> ${name} </p>
        <p><strong>Phone: </strong> ${phone} </p>
        <p><strong>Email: </strong> ${email} </p>
        <hr />
        </div>
        <div style="width: 95%; margin: 0 auto;">
        <h4>
            <u>Message</u>
        </h4>
        <p>${message}</p>
        </div>
    </div>`
}