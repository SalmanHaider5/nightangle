const { messagebird: { key } } = require('./keys')
const { messages } = require('messagebird')(key)

module.exports = (user, message) => {

    const params = {
        originator: 'NMC Pro',
        recipients: [
            user
        ],
        body: message
    }
    messages.create(params, (err, response) => {
        if(err){
            console.log('Error', err)
            return err
        }
        else{
            console.log(response)
            return response
        } 
    })
}
