const express                 = require('express')
const { json, urlencoded }    = require('body-parser')
const app                     = express()
const models                  = require('./models')
const PORT                    = process.env.PORT || 3000

app.use(json())
app.use(urlencoded({
    extended: true
}))

models.sequelize.sync();

app.get('/', (req, res) => {
    res.send('Welcome to NightAngle Application')
})

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})
