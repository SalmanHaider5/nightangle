const { tables: { bankDetails } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING, BOOLEAN, DATEONLY } = types
    return sequelize.define(bankDetails, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        insurance: {
            type: STRING
        },
        sortCode: {
            type: STRING
        },
        accountNumber: {
            type: STRING
        },
        userId: {
            type: STRING,
            unique: true
        }
    })
}