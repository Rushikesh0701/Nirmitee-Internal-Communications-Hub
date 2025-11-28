const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  quizQuestions: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Array of quiz questions and answers'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'modules',
  timestamps: true,
  underscored: false
});

module.exports = Module;

