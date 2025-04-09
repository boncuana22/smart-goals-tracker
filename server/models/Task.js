const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
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
  status: {
    type: DataTypes.ENUM('To Do', 'In Progress', 'Completed'),
    defaultValue: 'To Do'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium'
  },
  due_date: {
    type: DataTypes.DATE
  },
  // user_id și goal_id vor fi adăugate prin asocieri
}, {
  timestamps: true
});

module.exports = Task;