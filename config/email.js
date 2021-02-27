const nodemailer     = require('nodemailer')
const { nodemailer: { host, port, email, passowrd , secure} } = require('./keys').production

const sender = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
        user: email,
        pass: passowrd
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
        if(err) {
            console.log('Error', err)
        }
        else {
            console.log('Info', info)
        }
    })
}