const express              = require('express')
const { json, urlencoded } = require('body-parser')
const cors                 = require('cors')
const multer               = require('multer')
const app                  = express()
const models               = require('./models')
// const PORT                 = process.env.PORT || 8080
const PORT                 = process.env.PORT || 1000

app.use(json())
app.use(cors())
app.use(urlencoded({ extended: true }))
app.use(express.static('public'))

const publicUpload = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: publicUpload })
var fileUpload = upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'document', maxCount: 1 }
])

const { signup, verify, login, verifyToken, sendPasswordResetLink, resetPassword, verifyLogin }                      = require('./controllers/account')
const { create, addPhone, verifyPhone, getProfessionalDetails, updateProfessional, deleteTimesheet, updateProfessionalSecurityDetails, updateTimesheetShift, addTimesheet, getTimesheets, getSingletimesheet, updateShiftStatus, addBankDetails, updatedBankDetails }   = require('./controllers/professional')
const { add, getCompanyDetails, changePassword, updateCompany, searchProfessionals, searchTimesheets, filterProfessionalsByShift, makePayment }           = require('./controllers/company')
const { sendMessage } = require('./controllers/contact')
const { createClientSecret, getPaypalClientToken } = require('./controllers/payment')
const { createOffer, updateOffer } = require('./controllers/offers')

models.sequelize.sync();

app.post('/api/login', login)
app.post('/api/signup', signup)
app.get('/api/:userId/verify/:token', verify)
app.post('/api/reset', sendPasswordResetLink)
app.post('/api/:userId/professional', verifyToken, fileUpload, create)
app.post('/api/:userId/addPhone', addPhone)
app.post('/api/:userId/verifyPhone', verifyPhone)
app.post('/api/:userId/company', add)
app.post('/api/resetPassword/:userId', verifyToken, resetPassword)
app.post('/api/verifyLogin', verifyLogin)
app.get('/api/:userId/company', verifyToken, getCompanyDetails)
app.get('/api/:userId/professional', verifyToken,  getProfessionalDetails)
app.put('/api/:userId/professional', verifyToken, fileUpload, updateProfessional)
app.post('/api/:userId/professional/addTimesheet', verifyToken, addTimesheet)
app.get('/api/:userId/professional/timesheets', verifyToken, getTimesheets)
app.get('/api/timesheet/:timesheetId', verifyToken,  getSingletimesheet)
app.put('/api/:userId/professional/security', verifyToken, updateProfessionalSecurityDetails)
app.put('/api/shiftStatusChange/:shift/:status', verifyToken, updateShiftStatus)
app.put('/api/shift/:shiftId', verifyToken, updateTimesheetShift)
app.delete('/api/timesheet/:timesheetId', verifyToken, deleteTimesheet)
app.put('/api/:userId/company/changePassword', verifyToken, changePassword)
app.post('/api/user/sendMessage', verifyToken, sendMessage)
app.post('/api/guest/sendMessage', sendMessage)
app.put('/api/:userId/company', verifyToken, updateCompany)
app.get('/api/:userId/search/:skill', verifyToken, searchProfessionals)
app.get('/api/timesheets/:professionalId', verifyToken, searchTimesheets)
app.get('/api/timesheet/:timesheetId/search', verifyToken, filterProfessionalsByShift)
app.post('/api/company/:userId/payment', verifyToken, makePayment)
app.get('/api/company/clientSecret', verifyToken, createClientSecret)
app.get('/api/company/paypalToken/:userId', verifyToken, getPaypalClientToken)
app.post('/api/professional/:userId/bankDetails', verifyToken, addBankDetails)
app.put('/api/professional/:userId/bankDetails', verifyToken, updatedBankDetails)
app.post('/api/createOffer', verifyToken, createOffer)
app.put('/api/offer/:offerId', verifyToken, updateOffer)

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})
