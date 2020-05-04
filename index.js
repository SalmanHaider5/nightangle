const express              = require('express')
const { json, urlencoded } = require('body-parser')
const cors                 = require('cors')
const multer               = require('multer')
const app                  = express()
const models               = require('./models')
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
    { name: 'document', maxCount: 1 },
    { name: 'crbDocument', maxCount: 1 }
])

const { signup, verify, login, verifyToken, sendPasswordResetLink, resetPassword, verifyLogin }                      = require('./controllers/account')
const { create, addPhone, verifyPhone, getProfessionalDetails, updateProfessional, deleteTimesheet, updateProfessionalSecurityDetails, updateTimesheetShift, addTimesheet, getTimesheets, getSingletimesheet, updateShiftStatus }   = require('./controllers/professional')
const { add, getCompanyDetails, changePassword, updateCompany, searchProfessionals, searchTimesheets, filterProfessionalsByShift, makePayment }           = require('./controllers/company')
const { sendMessage } = require('./controllers/contact')
const { createClientSecret } = require('./controllers/payment')

models.sequelize.sync();

app.post('/login', login)
app.post('/signup', signup)
app.get('/:userId/verify/:token', verify)
app.post('/reset', sendPasswordResetLink)
app.post('/:userId/professional', verifyToken, fileUpload, create)
app.post('/:userId/addPhone', addPhone)
app.post('/:userId/verifyPhone', verifyPhone)
app.post('/:userId/company', add)
app.post('/resetPassword/:userId', verifyToken, resetPassword)
app.post('/verifyLogin', verifyLogin)
app.get('/:userId/company', verifyToken, getCompanyDetails)
app.get('/:userId/professional', verifyToken,  getProfessionalDetails)
app.put('/:userId/professional', verifyToken, fileUpload, updateProfessional)
app.post('/:userId/professional/addTimesheet', verifyToken, addTimesheet)
app.get('/:userId/professional/timesheets', verifyToken, getTimesheets)
app.get('/timesheet/:timesheetId', verifyToken,  getSingletimesheet)
app.put('/:userId/professional/security', verifyToken, updateProfessionalSecurityDetails)
app.put('/shiftStatusChange/:shift/:status', verifyToken, updateShiftStatus)
app.put('/shift/:shiftId', verifyToken, updateTimesheetShift)
app.delete('/timesheet/:timesheetId', verifyToken, deleteTimesheet)
app.put('/:userId/company/changePassword', verifyToken, changePassword)
app.post('/user/sendMessage', verifyToken, sendMessage)
app.post('/guest/sendMessage', sendMessage)
app.put('/:userId/company', verifyToken, updateCompany)
app.get('/:userId/search/:skill', verifyToken, searchProfessionals)
app.get('/timesheets/:professionalId', verifyToken, searchTimesheets)
app.get('/timesheet/:timesheetId/search', verifyToken, filterProfessionalsByShift)
app.post('/company/:userId/payment', verifyToken, makePayment)
app.get('/company/clientSecret', verifyToken, createClientSecret)

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})
