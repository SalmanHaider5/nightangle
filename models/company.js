const { tables: { company } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING, BOOLEAN } = types
    const Company =  sequelize.define(company, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        firstName: {
            type: STRING,
            allowNull: false
        },
        lastName: {
            type: STRING,
            allowNull: false
        },
        organization: {
            type: STRING,
            allowNull: false
        },
        tradingName: {
            type: STRING
        },
        address: {
            type: STRING,
            allowNull: false
        },
        city: {
            type: STRING,
            allowNull: false
        },
        county: {
            type: STRING
        },
        postalCode: {
            type: STRING,
            allowNull: false
        },
        website: {
            type: STRING
        },
        phone: {
            type: STRING,
            allowNull: false
        },
        registration: {
            type: STRING
        },
        charity: {
            type: BOOLEAN
        },
        charityReg: {
            type: STRING
        },
        subsidiary: {
            type: BOOLEAN
        },
        subsidiaryName: {
            type: STRING
        },
        subsidiaryAddress: {
            type: STRING
        },
        userId: {
            type: INTEGER
        }
    })
    Company.associate = (models) => {
        Company.hasOne(models.User, { as: 'user',  foreignKey: 'userId' })
    }
    return Company
}