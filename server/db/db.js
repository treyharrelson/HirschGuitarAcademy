require("dotenv").config();
const { Sequelize } = require('sequelize');


const sequelize = process.env.DATABASE_URL
? new Sequelize(process.env.DATABASE_URL, { //railway docker setup
    dialect: 'postgres',
    dialectOptions: { ssl: { rejectUnauthorized: false } },
    logging: false
})
: new Sequelize( // local Docker setup
    process.env.POSTGRES_DB,
    process.env.POSTGRES_USER,
    process.env.POSTGRES_PASSWORD,
    {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT,
        dialect: 'postgres',
        dialectOptions: {
            ssl: false
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// This was causing problems because of trying to do sequelize.sync() here and in server.js
// We should just have one place that syncs.
// sequelize.authenticate().then(() => {
//     console.log('Connection has been established successfully.');
//     // make sure tables exist
//     sequelize.sync({ alter: true, logging: false }).then(() => {
//         console.log('Tables synced successfully.');
//     });
// }).catch(err => {
//     console.error('Unable to connect to the database:', err);
// });

module.exports = sequelize;