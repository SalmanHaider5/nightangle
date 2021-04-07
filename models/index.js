const { Sequelize, DataTypes } = require('sequelize')

const {
    database: {
        HOST, USER, PASSWORD, DB, DIALECT
    }
}   = require('../config/keys')

const sequelize = new Sequelize(DB, USER, PASSWORD, {
    host: HOST,
    dialect: DIALECT
})

const models = {}
models.sequelize = sequelize

models.User            = require('./user')(sequelize, DataTypes)
models.Professional    = require('./professional')(sequelize, DataTypes)
models.Token           = require('./token')(sequelize, DataTypes)
models.Company         = require('./company')(sequelize, DataTypes)
models.Phone           = require('./phone')(sequelize, DataTypes)
models.Timesheet       = require('./timesheet')(sequelize, DataTypes)
models.SingleTimesheet = require('./singleTimesheet')(sequelize, DataTypes)
models.Payment         = require('./payment')(sequelize, DataTypes)
models.BankDetails     = require('./bankDetails')(sequelize, DataTypes)
models.Offer           = require('./offers')(sequelize, DataTypes)

module.exports = models