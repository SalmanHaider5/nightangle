const { messages } = require('messagebird')('raoB0UJm6c4QyK5SRplg5qDjq')

module.exports = (user, message) => {
    const params = {
        originator: 'Nightingale',
        recepients: [
            user
        ],
        body: message
    }
    messages.create(params, (err, response) => {
        if(err) return err
        else return response
    })
}
