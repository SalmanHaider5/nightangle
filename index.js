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

const { signup, verify, login, verifyToken, sendPasswordResetLink, resetPassword, verifyLogin, verifyUser, verifyPayment }                      = require('./controllers/account')
const { create, addPhone, verifyPhone, getProfessionalDetails, updateProfessional, deleteTimesheet, updateProfessionalSecurityDetails, updateTimesheetShift, addTimesheet, getTimesheets, getSingletimesheet, updateShiftStatus, addBankDetails, updatedBankDetails, verifyProfessional }   = require('./controllers/professional')
const { add, getCompanyDetails, changePassword, updateCompany, searchProfessionals, searchTimesheets, filterProfessionalsByShift, makePayment, verifyCompany }           = require('./controllers/company')
const { sendMessage } = require('./controllers/contact')
const { createClientSecret, getPaypalClientToken } = require('./controllers/payment')
const { createOffer, updateOffer } = require('./controllers/offers')

models.sequelize.sync();

app.post('/server/login', verifyUser, login)
app.post('/server/signup', signup)
app.get('/server/:userId/verify/:token', verify)
app.get('/server/:userId/reset', verifyUser, sendPasswordResetLink)
app.post('/server/:userId/professional', verifyToken, verifyUser, fileUpload, create)
app.post('/server/:userId/addPhone', verifyToken, verifyUser, addPhone)
app.post('/server/:userId/verifyPhone', verifyToken, verifyUser, verifyPhone)
app.post('/server/:userId/company', verifyToken, verifyUser, add)
app.post('/server/resetPassword/:userId', verifyToken, verifyUser, resetPassword)
app.post('/server/verifyLogin', verifyUser, verifyLogin)
app.get('/server/:userId/company', verifyToken, verifyUser, getCompanyDetails)
app.get('/server/:userId/professional',  verifyToken, verifyUser, getProfessionalDetails)
app.put('/server/:userId/professional', verifyToken, verifyUser, verifyProfessional, fileUpload, updateProfessional)
app.post('/server/:userId/professional/addTimesheet', verifyToken, addTimesheet)
app.get('/server/:userId/professional/timesheets', verifyToken, getTimesheets)
app.get('/server/timesheet/:timesheetId', verifyToken,  getSingletimesheet)
app.put('/server/:userId/professional/security/:type', verifyToken, verifyUser, verifyProfessional, updateProfessionalSecurityDetails)
app.put('/server/shiftStatusChange/:shift/:status', verifyToken, updateShiftStatus)
app.put('/server/shift/:shiftId', verifyToken, updateTimesheetShift)
app.delete('/server/timesheet/:timesheetId', verifyToken, deleteTimesheet)
app.put('/server/:userId/company/changePassword', verifyToken, verifyUser, changePassword)
app.post('/server/user/sendMessage', verifyToken, sendMessage)
app.post('/server/guest/sendMessage', sendMessage)
app.put('/server/:userId/company', verifyToken, verifyUser, verifyCompany, updateCompany)
app.get('/server/:userId/search/:skill', verifyToken, verifyUser, verifyCompany, verifyPayment, searchProfessionals)
app.get('/server/:userId/timesheets/:professionalId', verifyToken, verifyUser, verifyCompany, verifyPayment, searchTimesheets)
app.get('/server/:userId/timesheet/:timesheetId/search', verifyToken, verifyUser, verifyCompany, verifyPayment, filterProfessionalsByShift)
app.post('/server/company/:userId/payment', verifyToken, makePayment)
app.get('/server/company/clientSecret', verifyToken, createClientSecret)
app.get('/server/company/paypalToken/:userId', verifyToken, getPaypalClientToken)
app.post('/server/professional/:userId/bankDetails', verifyToken, addBankDetails)
app.put('/server/professional/:userId/bankDetails', verifyToken, updatedBankDetails)
app.post('/server/:userId/createOffer', verifyToken, verifyUser, verifyCompany, verifyPayment, createOffer)
app.put('/server/:userId/offer/:offerId', verifyToken, verifyUser, updateOffer)

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})
