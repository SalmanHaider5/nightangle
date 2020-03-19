const nodemailer     = require('nodemailer')

const {
    emailCredentials:{
        service,
        email,
        password
    }
} = require('../constants')

const sender = nodemailer.createTransport({
    host: service,
    port: 465,
    auth: {
        user: email,
        pass: password
    }
})

module.exports = (to, subject, content) => {
    const options = {
        from: email,
        to,
        subject,
        html: content
    }
    sender.sendMail(options, (err, info) => {
        if(err) return err
        else return info
    })
}