require("dotenv").config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.POSTGRES_DB,
    process.env.POSTGRES_USER,
    process.env.POSTGRES_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres'
    }
);

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
    // make sure tables exist
    sequelize.sync({ alter: true }).then(() => {
        console.log('Tables synced successfully.');
    });
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});

module.exports = sequelize;