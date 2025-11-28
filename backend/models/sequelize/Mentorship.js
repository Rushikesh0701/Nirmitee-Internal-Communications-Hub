const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Mentorship = sequelize.define('Mentorship', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  mentorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  menteeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'),
    defaultValue: 'PENDING'
  }
}, {
  tableName: 'mentorships',
  timestamps: true,
  underscored: false
});

module.exports = Mentorship;

