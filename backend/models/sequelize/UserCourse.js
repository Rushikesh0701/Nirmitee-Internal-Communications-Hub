const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const UserCourse = sequelize.define('UserCourse', {
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
  progressPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  status: {
    type: DataTypes.ENUM('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'CERTIFIED'),
    defaultValue: 'ENROLLED'
  }
}, {
  tableName: 'user_courses',
  timestamps: true,
  underscored: false,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'courseId']
    }
  ]
});

module.exports = UserCourse;

