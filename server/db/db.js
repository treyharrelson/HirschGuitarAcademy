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
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT,
        dialect: 'postgres',
    }
);

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
    // make sure tables exist
    sequelize.sync({ alter: true, logging: false }).then(() => {
        console.log('Tables synced successfully.');
    });
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});

module.exports = sequelize;