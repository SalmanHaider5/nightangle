const { tables: { offer } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING } = types
    return sequelize.define(offer, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        professional: {
            type: INTEGER
        },
        company: {
            type: INTEGER
        },
        shiftRate: {
            type: INTEGER
        },
        address: {
            type: STRING
        },
        shifts: {
            type: STRING,
            length: 1024
        },
        message: {
            type: STRING
        },
        professionalMsg: {
            type: STRING
        },
        status: {
            type: STRING,
            default: 'pending'
        }
    })
}