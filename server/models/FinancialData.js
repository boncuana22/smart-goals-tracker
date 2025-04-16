const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FinancialData = sequelize.define('FinancialData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  original_filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  data_period: {
    type: DataTypes.DATE,
    comment: 'Main date for the financial data (usually the end date)'
  },
  period_start: {
    type: DataTypes.DATE,
    comment: 'Start date of the financial period'
  },
  period_end: {
    type: DataTypes.DATE,
    comment: 'End date of the financial period'
  },
  period_display: {
    type: DataTypes.STRING,
    comment: 'Formatted display string for the period'
  },
  data_type: {
    type: DataTypes.ENUM('Balance Sheet', 'Income Statement', 'Cash Flow', 'Other'),
    defaultValue: 'Balance Sheet'
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false
  }
  // uploaded_by (FK) va fi adăugat prin asocieri
}, {
  timestamps: true
});

module.exports = FinancialData;