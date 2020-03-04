const { tables: { timesheet } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, DATE } = types
    return sequelize.define(timesheet, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        startingDay: {
            type: DATE
        },
        endingDay: {
            type: DATE
        },
        userId: {
            type: INTEGER
        }
    })
}