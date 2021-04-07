const { tables: { location } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING } = types
    return sequelize.define(location, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        longitude: {
            type: STRING
        },
        latitude: {
            type: STRING
        },
        userId: {
            type: STRING
        }
    })
}