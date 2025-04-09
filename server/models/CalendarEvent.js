const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CalendarEvent = sequelize.define('CalendarEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE
  },
  event_type: {
    type: DataTypes.ENUM('Task', 'Goal', 'Meeting', 'Other'),
    defaultValue: 'Other'
  },
  related_id: {
    type: DataTypes.INTEGER,
    comment: 'ID of related entity (task, goal, etc.) if applicable'
  }
  // user_id (FK) va fi adăugat prin asocieri
}, {
  timestamps: true
});

module.exports = CalendarEvent;