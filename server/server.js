const app = require('./app');
const sequelize = require('./db/db');

const port = 3000;

async function startServer() {
  sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
    // make sure tables exist
    sequelize.sync({ alter: true }).then(() => {
      console.log('Tables synced successfully.');
    });
  }).catch(err => {
    console.error('Unable to connect to the database:', err);
  });

  try {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}/`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
}


startServer();