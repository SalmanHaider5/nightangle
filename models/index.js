const { Sequelize, DataTypes }                = require('sequelize')
const { HOST, USER, PASSWORD, DB, DIALECT }   = require('../config/database')

const sequelize = new Sequelize(DB, USER, PASSWORD, {
    host: HOST,
    dialect: DIALECT
})

const models = {}
models.sequelize = sequelize

models.User    = require('./user')(sequelize, DataTypes)
models.Token   = require('./token')(sequelize, DataTypes)

module.exports = models