const { messages } = require('messagebird')('9qfC0goJbovHuSjqO8V1UK5OH')

module.exports = (user, message) => {

    console.log('Here')
    const params = {
        originator: 'NMC Reg',
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
