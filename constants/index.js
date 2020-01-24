
module.exports = {

    hostUrl: 'http://localhost:1000',
    signupSecret: 'nightingale',
    tokenExpiration: 1200, // In Seconds
    linkExpiration: 20, // In minutes

    responseMessages: {
        alreadyRegistered: 'Email is already registered. Please login into your account',
        emailSent: 'Email has been sent to you, please verify your account. Activation link is valid for only 20 minutes',
        generalErrorMessage: 'Something went wrong',
        linkExpired: 'Activation link has been expired, please register again and verify your account',
        alreadyVerified: 'Your account is already verified. Please login into your account',
        linkBroken: 'Activation link is broken. Please try again to verify or register again ',
        accountVerified: 'Your account has been verified please update your profile',
        recordAdded: 'Record successfully added'
    },

    emailCredentials: {
        service: 'gmail',
        email: 'salman.hayder112@gmail.com',
        password: 'inspiron@I5',
        emailVerificationSubject: 'Verify your Account',
        emailVerificationMessage: '<p>To verify your account please click on'
    },

    codes: {
        error: 'error',
        success: 'success',
        info: 'info'
    },

    tables: {
        token: 'token',
        user: 'user',
        professional: 'professional',
        company: 'company'
    },

    braintreeCredentials: {
        merchantId: 'wm733scpkh998vsc',
        publicKey: 'jj7zg2csp5ppmj25',
        privateKey: '3918d7f4464c74cbcaab666ea568c402'
    }
}