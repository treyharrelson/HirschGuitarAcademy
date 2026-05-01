const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const UserBadge = sequelize.define('UserBadge', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'user_id',
    references: { model: 'Users', key: 'id' }
  },
  badgeId: {
    type: DataTypes.INTEGER,
    primaryKey: true, 
    field: 'badge_id',
    references: { model: 'Badges', key: 'id' }
  }
}, {
  tableName: 'User_Badges',
  timestamps: true, 
});

module.exports = UserBadge;