const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  difficulty: {
    type: DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
    defaultValue: 'BEGINNER'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in minutes'
  }
}, {
  tableName: 'courses',
  timestamps: true,
  underscored: false
});

module.exports = Course;

