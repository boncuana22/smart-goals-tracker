const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = require('./User');
const Task = require('./Task');
const Goal = require('./Goal');
const FinancialData = require('./FinancialData');
const FinancialMetric = require('./FinancialMetric');
const KPI = require('./KPI');
const CalendarEvent = require('./CalendarEvent');

// Relații User - Task
User.hasMany(Task, { foreignKey: 'user_id', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'user_id' });

// Relații User - Goal (created by)
User.hasMany(Goal, { foreignKey: 'created_by', as: 'goals' });
Goal.belongsTo(User, { foreignKey: 'created_by' });

// Relații Goal - Task
Goal.hasMany(Task, { foreignKey: 'goal_id', as: 'tasks' });
Task.belongsTo(Goal, { foreignKey: 'goal_id' });

// Relații User - FinancialData
User.hasMany(FinancialData, { foreignKey: 'uploaded_by', as: 'financialData' });
FinancialData.belongsTo(User, { foreignKey: 'uploaded_by' });

// Relații FinancialData - FinancialMetric
FinancialData.hasMany(FinancialMetric, { foreignKey: 'financial_data_id', as: 'metrics' });
FinancialMetric.belongsTo(FinancialData, { foreignKey: 'financial_data_id' });

// Relații Goal - KPI
Goal.hasMany(KPI, { foreignKey: 'goal_id', as: 'kpis' });
KPI.belongsTo(Goal, { foreignKey: 'goal_id' });

// Relații User - CalendarEvent
User.hasMany(CalendarEvent, { foreignKey: 'user_id', as: 'calendarEvents' });
CalendarEvent.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  Task,
  Goal,
  FinancialData,
  FinancialMetric,
  KPI,
  CalendarEvent
};