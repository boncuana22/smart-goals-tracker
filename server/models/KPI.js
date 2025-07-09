const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const KPI = sequelize.define('KPI', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  target_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: null
  },
  current_value: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  unit: {
    type: DataTypes.STRING,
    comment: 'Unit of measurement (e.g., $, %, count)'
  },
  weight_in_goal: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Weight of this KPI in the goal (percentage)'
  },
  kpi_type: {
    type: DataTypes.ENUM('operational', 'financial'),
    defaultValue: 'operational',
    comment: 'Type of KPI'
  },
  financial_progress_weight: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100,
    comment: 'Weight of financial progress in KPI (percentage)'
  },
  tasks_progress_weight: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Weight of tasks progress in KPI (percentage)'
  },
  is_achieved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Marks if the KPI is considered achieved'
  },
  goal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Goals',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  }
}, {
  timestamps: true
});

module.exports = KPI;