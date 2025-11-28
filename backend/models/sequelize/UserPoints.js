const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const UserPoints = sequelize.define('UserPoints', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'user_points',
  timestamps: true,
  underscored: false
});

module.exports = UserPoints;

