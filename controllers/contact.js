const SendEmail = require('../config/email')
const {
    codes:{
        success
    },
    responseMessages:{
        messageSent
    }
} = require('../constants')

exports.sendMessage = (req, res) => {
    const { body: { name, phone, email, subject, message } } = req
    const account = 'salman.hayder112@gmail.com'
    let content = `<b>Name: </b>${name}<br>`
    content += `<b>Phone: </b>${phone}<br>`
    content += `<b>Email: </b>${email}<br>`
    content += `<b>Message: </b>${message}<br>`
    SendEmail(account, subject, content)
    res.json({
        code: success,
        response: {
            title: 'Message Sent',
            message: messageSent
        }
    })
}