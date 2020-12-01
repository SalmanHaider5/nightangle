const nodemailer     = require('nodemailer')

const {
    emailCredentials:{
        service,
        email,
        password
    }
} = require('../constants')

const sender = nodemailer.createTransport({
    host: 'nmcregistered.org.uk',
    port: 465,
    secure: true,
    auth: {
        user: 'account@nmcregistered.org.uk',
        pass: 'Care@1234'
    }
})

module.exports = ({ to, subject, content }) => {
    const options = {
        from: '"NMC Account" <account@nmcregistered.org.uk>',
        to,
        subject,
        html: content
    }
    sender.sendMail(options, (err, info) => {
        if(err) return err
        else return info
    })
}