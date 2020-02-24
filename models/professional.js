const { tables: { professional } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING, BOOLEAN, DATE } = types
    const Professional =  sequelize.define(professional, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        fullName: {
            type: STRING,
            allowNull: false
        },
        dateOfBirth: {
            type: DATE,
            allowNull: false
        },
        postalCode: {
            type: INTEGER,
            allowNull: false
        },
        address: {
            type: STRING,
            allowNull: false
        },
        nmcPin:{
            type: INTEGER,
            allowNull: false
        },
        hasTransport: {
            type: BOOLEAN,
            allowNull: false,
            default: false
        },
        twoFactorAuthentication: {
            type: BOOLEAN,
            default: false
        },
        idField:{
            type: STRING
        },
        experience:{
            type: STRING(2048)
        },
        userId:{
            type: INTEGER
        }
    })
    Professional.associate = (models) => {
        Professional.hasOne(models.User, { as: 'user',  foreignKey: 'userId' })
    }
    return Professional
}