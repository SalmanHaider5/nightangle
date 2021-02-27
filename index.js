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
app.use('/uploads', express.static('public'))
app.use(express.static(path.join(__dirname, 'build')));

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

const { signup, verify, login, verifyToken, sendPasswordResetLink, resetPassword, verifyLogin, verifyUser, verifyPayment, getUserByEmail }                      = require('./controllers/account')
const { create, addPhone, verifyPhone, getProfessionalDetails, updateProfessional, deleteTimesheet, updateProfessionalSecurityDetails, updateTimesheetShift, addTimesheet, getTimesheets, getSingletimesheet, updateShiftStatus, addBankDetails, updatedBankDetails, verifyProfessional }   = require('./controllers/professional')
const { add, getCompanyDetails, changePassword, updateCompany, searchProfessionals, searchTimesheets, filterProfessionalsByShift, makePayment, verifyCompany }           = require('./controllers/company')
const { sendMessage } = require('./controllers/contact')
const { createStripeSecret, getPaypalClientToken, verifyStripePayment, capturePaypalTransaction } = require('./controllers/payment')
const { createOffer, updateOffer } = require('./controllers/offers')

models.sequelize.sync();

app.post('/server/login', getUserByEmail, login)
app.post('/server/signup', signup)
app.get('/server/:userId/verify/:token', verify)
app.post('/server/reset/password/link', getUserByEmail, sendPasswordResetLink)
app.post('/server/:userId/professional', verifyToken, verifyUser, fileUpload, create)
app.post('/server/:userId/add/phone', verifyToken, verifyUser, addPhone)
app.post('/server/:userId/verify/phone', verifyToken, verifyUser, verifyPhone)
app.post('/server/:userId/company', verifyToken, verifyUser, add)
app.post('/server/:userId/reset/password', verifyToken, verifyUser, resetPassword)
app.post('/server/:userId/verify/login', verifyUser, verifyLogin)
app.get('/server/:userId/company', verifyToken, verifyUser, getCompanyDetails)
app.get('/server/:userId/professional',  verifyToken, verifyUser, getProfessionalDetails)
app.put('/server/:userId/professional', verifyToken, verifyUser, verifyProfessional, fileUpload, updateProfessional)
app.post('/server/:userId/timesheets', verifyToken, verifyUser, addTimesheet)
app.get('/server/:userId/timesheets', verifyToken, verifyUser, getTimesheets)
app.get('/server/:userId/timesheet/:timesheetId', verifyToken, verifyUser, getSingletimesheet)
app.put('/server/:userId/professional/security/:type', verifyToken, verifyUser, verifyProfessional, updateProfessionalSecurityDetails)
app.put('/server/:userId/shift/:shift/status', verifyToken, verifyUser, updateShiftStatus)
app.put('/server/:userId/shift/:shiftId', verifyToken, verifyUser, updateTimesheetShift)
app.delete('/server/:userId/timesheet/:timesheetId', verifyToken, verifyUser, deleteTimesheet)
app.put('/server/:userId/company/change/password', verifyToken, verifyUser, changePassword)
app.post('/server/:userId/send/message', verifyToken, verifyUser, sendMessage)
app.post('/server/guest/message', sendMessage)
app.put('/server/:userId/company', verifyToken, verifyUser, verifyCompany, updateCompany)
app.get('/server/:userId/search/professional/:skill', verifyToken, verifyUser, verifyCompany, verifyPayment, searchProfessionals)
app.get('/server/:userId/timesheets/:professionalId', verifyToken, verifyUser, verifyCompany, verifyPayment, searchTimesheets)
app.get('/server/:userId/timesheet/:timesheetId/filter', verifyToken, verifyUser, verifyCompany, verifyPayment, filterProfessionalsByShift)
app.post('/server/:userId/company/payment/stripe', verifyToken, verifyUser, verifyStripePayment, makePayment)
app.post('/server/:userId/company/payment/paypal', verifyToken, verifyUser, capturePaypalTransaction, makePayment)
app.get('/server/:userId/company/client/secret/stripe', verifyToken, verifyUser, createStripeSecret)
app.post('/server/:userId/professional/bank/details', verifyToken, addBankDetails)
app.put('/server/:userId/professional/bank/details', verifyToken, updatedBankDetails)
app.post('/server/:userId/offer', verifyToken, verifyUser, verifyCompany, verifyPayment, createOffer)
app.put('/server/:userId/offer/:offerId', verifyToken, verifyUser, updateOffer)

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})
