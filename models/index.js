const { Sequelize, DataTypes }                = require('sequelize')
const { HOST, USER, PASSWORD, DB, DIALECT }   = require('../config/database')

const sequelize = new Sequelize(DB, USER, PASSWORD, {
    host: HOST,
    dialect: DIALECT
})

const models = {}
models.sequelize = sequelize

models.company = require('./company')(sequelize, DataTypes)
models.professional = require('./professional')(sequelize, DataTypes)

module.exports = models