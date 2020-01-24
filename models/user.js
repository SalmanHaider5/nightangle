const { tables: { user } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING, BOOLEAN } = types
    const User =  sequelize.define(user, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type: STRING,
            unique: true
        },
        password: {
            type: STRING
        },
        role: {
            type: STRING,
        },
        isVerified: {
            type: BOOLEAN
        }
    })
    return User
}