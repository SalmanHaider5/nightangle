const { tables: { phone } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING, BOOLEAN } = types
    return sequelize.define(phone, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        phone: {
            type: STRING
        },
        code: {
            type: STRING,
            unique: true
        },
        status: {
            type: BOOLEAN,
            default: false
        },
        userId: {
            type: STRING
        }
    })
}