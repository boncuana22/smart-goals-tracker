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
  kpi_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'KPI asociat cu acest task (pentru KPI-uri operaționale)'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'User who owns/is assigned this task'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User assigned to this task'
  },
  goal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Goal this task is associated with (optional)'
  }
}, {
  timestamps: true
});

module.exports = Task;