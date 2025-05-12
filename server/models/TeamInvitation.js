const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamInvitation = sequelize.define('TeamInvitation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
    defaultValue: 'pending'
  }
  // team_id and invited_by (user_id) will be added via associations
}, {
  timestamps: true
});

module.exports = TeamInvitation;