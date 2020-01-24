const { connect, Environment: { Sandbox } } = require('braintree')

const { braintreeCredentials: {
    merchantId,
    publicKey,
    privateKey
} } = require('../constants')

const gateway = connect({
    environment: Sandbox,
    merchantId,
    publicKey,
    privateKey
})

module.exports = gateway