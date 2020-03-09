const { tables: { professional } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING, BOOLEAN, DATE } = types
    const Professional =  sequelize.define(professional, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        status: {
            type: STRING
        },
        profilePicture:{
            type: STRING
        },
        fullName: {
            type: STRING,
            allowNull: false
        },
        dateOfBirth: {
            type: DATE,
            allowNull: false
        },
        postCode: {
            type: STRING,
            allowNull: false
        },
        address: {
            type: STRING,
            allowNull: false
        },
        city:{
            type: STRING
        },
        county:{
            type: STRING
        },
        nmcPin:{
            type: INTEGER,
            allowNull: false
        },
        hasTransport: {
            type: BOOLEAN,
            default: false
        },
        distance:{
            type: INTEGER
        },
        qualification:{
            type: STRING
        },
        twoFactorAuthentication: {
            type: BOOLEAN,
            default: false
        },
        document:{
            type: STRING
        },
        cpdHours:{
            type: INTEGER
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