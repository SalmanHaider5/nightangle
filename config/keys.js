const app = require('dotenv')
app.config()

module.exports = {
    port: process.env.PORT,
    nodemailer: {
        host: process.env.HOST,
        port: process.env.EMAIL_PORT,
        email: process.env.EMAIL,
        passowrd: process.env.PASSWORD,
        secure: process.env.SECURE
    },
    messagebird: {
        key: process.env.MESSAGEBIRD_KEY
    },
    stripe: {
        key: process.env.STRIPE_KEY
    },
    paypal: {
        clientID: process.env.PAYPAL_ID,
        clientSecret: process.env.PAYPAL_SECRET
    },
    config: {
        server: process.env.SERVER_URL,
        app: process.env.APP_URL,
        secret: process.env.SECRET
    },
    database: {
        HOST: process.env.DB_HOST,
        USER: process.env.USER,
        PASSWORD: process.env.DB_PASSWORD,
        DB: process.env.DB,
        DIALECT: process.env.DIALECT
    }
}