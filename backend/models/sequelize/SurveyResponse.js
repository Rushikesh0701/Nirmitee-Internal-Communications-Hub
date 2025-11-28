const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const SurveyResponse = sequelize.define('SurveyResponse', {
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
  questionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'survey_questions',
      key: 'id'
    }
  },
  responseValue: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Stores the response value (text, rating number, or selected option)'
  }
  // Note: userId is intentionally NOT included to maintain anonymity
}, {
  tableName: 'survey_responses',
  timestamps: true,
  underscored: false
});

module.exports = SurveyResponse;

