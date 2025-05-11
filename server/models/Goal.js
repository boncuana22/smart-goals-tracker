const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Goal = sequelize.define('Goal', {
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
  specific_details: {
    type: DataTypes.TEXT,
    comment: 'Specific details about what the goal aims to achieve'
  },
  measurable_metrics: {
    type: DataTypes.TEXT,
    comment: 'Metrics used to measure progress and success'
  },
  achievable_factors: {
    type: DataTypes.TEXT,
    comment: 'Factors that make this goal achievable'
  },
  relevant_reasoning: {
    type: DataTypes.TEXT,
    comment: 'Why this goal is relevant to broader objectives'
  },
  time_bound_date: {
    type: DataTypes.DATE,
    comment: 'Deadline for achieving this goal'
  },
  status: {
    type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'On Hold'),
    defaultValue: 'Not Started'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Progress percentage from 0 to 100'
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'The team this goal belongs to'
  }
  
}, {
  timestamps: true
});

module.exports = Goal;