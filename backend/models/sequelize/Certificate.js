const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Certificate = sequelize.define('Certificate', {
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
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  issuedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  certificateUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'certificates',
  timestamps: true,
  underscored: false
});

module.exports = Certificate;

