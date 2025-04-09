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
    type: DataTypes.DECIMAL(15, 2)
  },
  current_value: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  unit: {
    type: DataTypes.STRING,
    comment: 'Unit of measurement (e.g., $, %, count)'
  }
  // goal_id (FK) va fi adăugat prin asocieri
}, {
  timestamps: true
});

module.exports = KPI;