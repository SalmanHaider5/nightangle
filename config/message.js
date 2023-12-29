const { messages } = require('messagebird')('<key>')

module.exports = (user, message) => {
    const params = {
        originator: 'Nightingale',
        recipients: [
            user
        ],
        body: message
    }
    messages.create(params, (err, response) => {
        if(err){
            return err
        }
        else{
            return response
        } 
    })
}
