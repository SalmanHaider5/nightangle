const { tables: { token } } = require('../constants')

module.exports  = (sequelize, types) => {
    const { INTEGER, STRING } = types
    return sequelize.define(token, {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type: STRING,
            unique: true
        },
        token: {
            type: STRING
        }
    })
}