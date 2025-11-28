const { Sequelize } = require('sequelize');
const os = require('os');
require('dotenv').config();

// On macOS, PostgreSQL often uses the system username instead of 'postgres'
const defaultUser = process.env.DB_USER || (process.platform === 'darwin' ? os.userInfo().username : 'postgres');
const defaultPassword = process.env.DB_PASSWORD || '';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'nirmitee_hub',
  defaultUser,
  defaultPassword,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Better error handling
    dialectOptions: {
      connectTimeout: 10000
    }
  }
);

module.exports = sequelize;

