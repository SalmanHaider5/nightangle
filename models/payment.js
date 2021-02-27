const { tables: { payment } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING, BOOLEAN, DATEONLY } = types
    return sequelize.define(payment, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        balance: {
            type: STRING
        },
        vat: {
            type: STRING
        },
        payDate: {
            type: DATEONLY
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