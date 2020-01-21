module.exports  = (sequelize, types) => {
    const { INTEGER, STRING } = types
    return sequelize.define('professional', {
        id: {
            type: INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type: STRING,
            unique: true
        },
        password: {
            type: STRING
        }
    })
}