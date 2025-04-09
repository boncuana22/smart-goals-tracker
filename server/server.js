const express = require('express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/database');
require('dotenv').config();

// Importă modelele
const models = require('./models');

// Inițializare Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rută de test
app.get('/', (req, res) => {
  res.json({ message: 'Bine ai venit la API-ul SMART Goals Tracker!' });
});

// Testarea conexiunii la baza de date
testConnection();

// Sincronizarea modelelor cu baza de date (în producție ar trebui folosit "migrate")
sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    console.log('Baza de date a fost sincronizată.');
  })
  .catch(error => {
    console.error('Eroare la sincronizarea bazei de date:', error);
  });

// Pornirea serverului
app.listen(PORT, () => {
  console.log(`Serverul rulează pe portul ${PORT}`);
});