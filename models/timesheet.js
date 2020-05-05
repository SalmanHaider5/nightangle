const moment = require('moment')
require('moment/locale/en-gb') 
moment.locale('en-gb')

const { tables: { timesheet } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, DATEONLY } = types
    return sequelize.define(timesheet, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        startingDay: {
            type: DATEONLY
        },
        endingDay: {
            type: DATEONLY
        },
        userId: {
            type: INTEGER
        }
    })
}