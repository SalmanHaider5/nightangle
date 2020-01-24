const express              = require('express')
const { json, urlencoded } = require('body-parser')
const app                  = express()
const models               = require('./models')
const cors                 = require('cors')
const PORT                 = process.env.PORT || 1000

const { signup, verify }   = require('./controllers/account')
const { create }           = require('./controllers/professional')
const { add, getPaymentClientToken }           = require('./controllers/company')

app.use(json())
app.use(cors())
app.use(urlencoded({ extended: true }))

models.sequelize.sync();

app.post('/signup', signup)
app.get('/:userId/verify/:token', verify)
app.post('/:userId/professional', create)
app.post('/:userId/company', add)
app.get('/company/clientToken/:userId', getPaymentClientToken)

app.listen(1000, () => {
    console.log(`Server is listening on port ${PORT}`)
})
