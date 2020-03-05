const express              = require('express')
const { json, urlencoded } = require('body-parser')
const app                  = express()
const models               = require('./models')
const cors                 = require('cors')
const PORT                 = process.env.PORT || 1000

const { signup, verify, login, verifyToken, sendPasswordResetLink, resetPassword, verifyLogin }                      = require('./controllers/account')
const { create, addPhone, verifyPhone, getProfessionalDetails, updateProfessional, deleteTimesheet, updateProfessionalSecurityDetails, updateTimesheetShift, addTimesheet, getTimesheets, getSingletimesheet, updateShiftStatus }   = require('./controllers/professional')
const { add, getPaymentClientToken, getCompanyDetails }           = require('./controllers/company')

app.use(json())
app.use(cors())
app.use(urlencoded({ extended: true }))

models.sequelize.sync();

app.post('/login', login)
app.post('/signup', signup)
app.get('/:userId/verify/:token', verify)
app.post('/reset', sendPasswordResetLink)
app.post('/:userId/professional', create)
app.post('/:userId/addPhone', addPhone)
app.post('/:userId/verifyPhone', verifyPhone)
app.post('/:userId/company', add)
app.post('/resetPassword/:userId', verifyToken, resetPassword)
app.post('/verifyLogin', verifyLogin)
app.get('/:userId/company', verifyToken, getCompanyDetails)
app.get('/:userId/professional', verifyToken, getProfessionalDetails)
app.put('/:userId/professional', verifyToken, updateProfessional)
app.post('/:userId/professional/addTimesheet', verifyToken, addTimesheet)
app.get('/:userId/professional/timesheets', verifyToken, getTimesheets)
app.get('/timesheet/:timesheetId', verifyToken,  getSingletimesheet)
app.put('/:userId/professional/security', verifyToken, updateProfessionalSecurityDetails)
app.get('/company/clientToken/:userId', verifyToken, getPaymentClientToken)
app.put('/shiftStatusChange/:shift/:status', verifyToken, updateShiftStatus)
app.put('/shift/:shiftId', verifyToken, updateTimesheetShift)
app.delete('/timesheet/:timesheetId', verifyToken, deleteTimesheet)

app.listen(1000, () => {
    console.log(`Server is listening on port ${PORT}`)
})
