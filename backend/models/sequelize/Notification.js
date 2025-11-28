const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Notification = sequelize.define('Notification', {
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
  type: {
    type: DataTypes.ENUM(
      'MENTION',
      'RECOGNITION',
      'GROUP_POST',
      'SURVEY_PUBLISHED',
      'ANNOUNCEMENT',
      'MENTORSHIP_REQUEST',
      'COURSE_COMPLETED'
    ),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional data like postId, recognitionId, etc.'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: false,
  indexes: [
    {
      fields: ['userId', 'isRead']
    }
  ]
});

module.exports = Notification;

