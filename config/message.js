const { messages } = require('messagebird')('8026VIjiufUqrQlLZMYG87CL5')

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
