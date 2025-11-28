const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Redemption = sequelize.define('Redemption', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rewardId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'reward_catalogs',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING'
  }
}, {
  tableName: 'redemptions',
  timestamps: true,
  underscored: false
});

module.exports = Redemption;

