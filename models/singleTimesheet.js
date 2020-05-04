const { tables: { singleTimesheet } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING, DATE, BOOLEAN } = types
    return sequelize.define(singleTimesheet, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        date: {
            type: STRING
        },
        shift: {
            type: STRING
        },
        time: {
            type: STRING
        },
        status: {
            type: BOOLEAN
        },
        timesheetId: {
            type: INTEGER
        }
    })
}