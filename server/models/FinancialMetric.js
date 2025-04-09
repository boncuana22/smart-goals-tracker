const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FinancialMetric = sequelize.define('FinancialMetric', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  metric_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  current_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  previous_value: {
    type: DataTypes.DECIMAL(15, 2)
  },
  percentage_change: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Calculated percentage change between current and previous values'
  },
  // financial_data_id (FK) va fi adăugat prin asocieri
}, {
  timestamps: true
});

module.exports = FinancialMetric;