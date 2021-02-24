const { messages } = require('messagebird')('zjaxTCPiBJRkAWOCW3gs2jQVA')

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
