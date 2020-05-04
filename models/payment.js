const { tables: { payment } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING, BOOLEAN } = types
    return sequelize.define(payment, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        balance: {
            type: STRING
        },
        payDate: {
            type: STRING
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