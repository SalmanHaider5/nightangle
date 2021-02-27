module.exports = {
    dev: {
        nodemailer: {
            host: 'smtp.gmail.com',
            port: 587,
            email: 'salman.apper@gmail.com',
            passowrd: 'nextGen@1572',
            secure: false
        }
    },
    production: {
        nodemailer: {
            host: 'nmcregistered.org.uk',
            port: 465,
            email: 'account@nmcregistered.org.uk',
            passowrd: 'Care@1234',
            secure: true
        }
    }
}