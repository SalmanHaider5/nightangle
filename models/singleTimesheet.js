const { tables: { singleTimesheet } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING, DATEONLY, BOOLEAN } = types
    return sequelize.define(singleTimesheet, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        date: {
            type: DATEONLY
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