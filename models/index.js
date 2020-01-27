const { Sequelize, DataTypes }                = require('sequelize')
const { HOST, USER, PASSWORD, DB, DIALECT }   = require('../config/database')

const sequelize = new Sequelize(DB, USER, PASSWORD, {
    host: HOST,
    dialect: DIALECT
})

const models = {}
models.sequelize = sequelize

models.User         = require('./user')(sequelize, DataTypes)
models.Token        = require('./token')(sequelize, DataTypes)
models.Company      = require('./company')(sequelize, DataTypes)
models.Professional = require('./professional')(sequelize, DataTypes)
models.Phone        = require('./phone')(sequelize, DataTypes)

module.exports = models