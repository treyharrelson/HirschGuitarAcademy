const path = require('path');

try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
} catch (e) {
    // In production/Railway, dotenv isn't needed as variables are already in process.env
    console.log("Note: .env file or dotenv module not found. Using system environment variables.");
}

module.exports = {
  development: {
    username: process.env.POSTGRES_USER || 'postgres',
    password: String(process.env.POSTGRES_PASSWORD || 'password'), // Explicitly cast to string
    database: process.env.POSTGRES_DB || 'hirsch_guitar_db',
    host: '127.0.0.1', 
    dialect: 'postgres',
    port: 5432
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};