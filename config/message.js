const { messages } = require('messagebird')('9qfC0goJbovHuSjqO8V1UK5OH')

module.exports = (user, message) => {
    const params = {
        originator: 'NMC Reg Text',
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
