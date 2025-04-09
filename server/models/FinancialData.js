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
    comment: 'Period/date for which the financial data is relevant'
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