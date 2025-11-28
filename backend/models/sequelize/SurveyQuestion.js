const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const SurveyQuestion = sequelize.define('SurveyQuestion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  surveyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'surveys',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('MCQ', 'RATING', 'TEXT'),
    allowNull: false
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'For MCQ: array of options. For RATING: {min: 1, max: 5}'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'survey_questions',
  timestamps: true,
  underscored: false
});

module.exports = SurveyQuestion;

