const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, testConnection } = require('./config/database');
require('dotenv').config();

// Importă rutele
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const goalRoutes = require('./routes/goalRoutes');
const financialRoutes = require('./routes/financialRoutes');
const kpiRoutes = require('./routes/kpiRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const teamRoutes = require('./routes/teamRoutes');
const userRoutes = require('./routes/userRoutes');

// Inițializare Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Directoare statice
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rute API
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/users', userRoutes);


// Rută de test
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SMART Goals Tracker API!' });
});

// Testarea conexiunii la baza de date
testConnection();

// Sincronizarea modelelor cu baza de date (în producție ar trebui folosit "migrate")
sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    console.log('Database synchronized successfully.');
  })
  .catch(error => {
    console.error('Error synchronizing database:', error);
  });

// Pornirea serverului
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});