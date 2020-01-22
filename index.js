const express              = require('express')
const { json, urlencoded } = require('body-parser')
const app                  = express()
const models               = require('./models')
const PORT                 = process.env.PORT || 3000

const { signup, verify }   = require('./controllers/account')

app.use(json())
app.use(urlencoded({ extended: true }))

models.sequelize.sync();

app.post('/signup', signup)
app.get('/:userId/verify/:token', verify)

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})
