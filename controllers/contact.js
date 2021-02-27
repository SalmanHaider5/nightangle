const SendEmail = require('../config/email')
const { getContactEmailContent, getResponse } = require('./helpers')
const {
    codes: { success },
    responseMessages: { messageSent }
} = require('../constants')

exports.sendMessage = (req, res) => {
    const { body: { name, phone, email, subject, message } } = req
    SendEmail(getContactEmailContent(name, phone, email, subject, message))
    const response = getResponse(success, 'Message Sent', messageSent)
    res.json(response)
}