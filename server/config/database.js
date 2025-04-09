const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('Încercare de conectare la baza de date cu:', {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  host: process.env.DB_HOST
});

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 60000
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexiunea la baza de date a fost stabilită cu succes.');
  } catch (error) {
    console.error('Nu se poate conecta la baza de date:', error);
  }
};

module.exports = { sequelize, testConnection };