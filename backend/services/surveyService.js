const { Survey, SurveyQuestion, SurveyResponse, User } = require('../models/sequelize/index');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

/**
 * Create a new survey with questions
 */
const createSurvey = async (surveyData) => {
  const { title, description, questions, createdBy } = surveyData;

  const survey = await Survey.create({
    title,
    description,
    createdBy,
    status: 'ACTIVE'
  });

  // Create questions
  if (questions && questions.length > 0) {
    const questionPromises = questions.map((q, index) =>
      SurveyQuestion.create({
        surveyId: survey.id,
        type: q.type,
        questionText: q.questionText,
        options: q.options || null,
        order: index
      })
    );
    await Promise.all(questionPromises);
  }

  return await Survey.findByPk(survey.id, {
    include: [
      {
        model: SurveyQuestion,
        as: 'questions'
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [
      [{ model: SurveyQuestion, as: 'questions' }, 'order', 'ASC']
    ]
  });
};

/**
 * Update survey
 */
const updateSurvey = async (surveyId, updateData) => {
  const survey = await Survey.findByPk(surveyId);
  if (!survey) {
    throw new Error('Survey not found');
  }

  const { title, description, status, questions } = updateData;

  if (title) survey.title = title;
  if (description !== undefined) survey.description = description;
  if (status) survey.status = status;

  await survey.save();

  // Update questions if provided
  if (questions) {
    // Delete existing questions
    await SurveyQuestion.destroy({ where: { surveyId } });

    // Create new questions
    const questionPromises = questions.map((q, index) =>
      SurveyQuestion.create({
        surveyId: survey.id,
        type: q.type,
        questionText: q.questionText,
        options: q.options || null,
        order: index
      })
    );
    await Promise.all(questionPromises);
  }

  return await Survey.findByPk(survey.id, {
    include: [
      {
        model: SurveyQuestion,
        as: 'questions'
      }
    ],
    order: [
      [{ model: SurveyQuestion, as: 'questions' }, 'order', 'ASC']
    ]
  });
};

/**
 * Get survey list
 */
const getSurveyList = async (options = {}) => {
  const { status, page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  }

  const { count, rows } = await Survey.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  return {
    surveys: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    }
  };
};

/**
 * Get survey by ID with questions
 */
const getSurveyById = async (surveyId) => {
  const survey = await Survey.findByPk(surveyId, {
    include: [
      {
        model: SurveyQuestion,
        as: 'questions'
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [
      [{ model: SurveyQuestion, as: 'questions' }, 'order', 'ASC']
    ]
  });

  if (!survey) {
    throw new Error('Survey not found');
  }

  return survey;
};

/**
 * Submit survey response (anonymous)
 */
const submitSurveyResponse = async (surveyId, responses) => {
  // Verify survey exists and is active
  const survey = await Survey.findByPk(surveyId);
  if (!survey) {
    throw new Error('Survey not found');
  }

  if (survey.status !== 'ACTIVE') {
    throw new Error('Survey is not active');
  }

  // Validate responses
  const questions = await SurveyQuestion.findAll({
    where: { surveyId }
  });

  if (responses.length !== questions.length) {
    throw new Error('All questions must be answered');
  }

  // Create responses (no userId stored for anonymity)
  const responsePromises = responses.map(response =>
    SurveyResponse.create({
      surveyId,
      questionId: response.questionId,
      responseValue: response.responseValue
    })
  );

  await Promise.all(responsePromises);

  return { success: true, message: 'Response submitted successfully' };
};

/**
 * Get survey analytics
 */
const getSurveyAnalytics = async (surveyId) => {
  const survey = await Survey.findByPk(surveyId, {
    include: [
      {
        model: SurveyQuestion,
        as: 'questions'
      }
    ],
    order: [
      [{ model: SurveyQuestion, as: 'questions' }, 'order', 'ASC']
    ]
  });

  if (!survey) {
    throw new Error('Survey not found');
  }

  const analytics = {
    surveyId: survey.id,
    title: survey.title,
    totalResponses: 0,
    questions: []
  };

  // Get total response count (count unique question responses per survey)
  // Since responses are anonymous, we approximate by counting all responses
  const totalResponses = await SurveyResponse.count({
    where: { surveyId }
  });

  // Count unique responses by grouping (approximate)
  const responseGroups = await SurveyResponse.findAll({
    where: { surveyId },
    attributes: [
      'questionId',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'responseCount']
    ],
    group: ['questionId']
  });

  const responseCountMap = {};
  responseGroups.forEach(group => {
    responseCountMap[group.questionId] = parseInt(group.dataValues.responseCount);
  });

  // Calculate analytics for each question
  for (const question of survey.questions) {
    const questionAnalytics = {
      questionId: question.id,
      questionText: question.questionText,
      type: question.type,
      responseCount: responseCountMap[question.id] || 0
    };

    if (question.type === 'RATING') {
      // Calculate average rating
      const ratingResponses = await SurveyResponse.findAll({
        where: {
          surveyId,
          questionId: question.id
        },
        attributes: ['responseValue']
      });

      if (ratingResponses.length > 0) {
        const ratings = ratingResponses.map(r => parseFloat(r.responseValue)).filter(r => !isNaN(r));
        questionAnalytics.averageRating = ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
          : 0;
        questionAnalytics.ratingDistribution = {
          min: Math.min(...ratings),
          max: Math.max(...ratings),
          count: ratings.length
        };
      }
    } else if (question.type === 'MCQ') {
      // Count responses per option
      const mcqResponses = await SurveyResponse.findAll({
        where: {
          surveyId,
          questionId: question.id
        },
        attributes: ['responseValue']
      });

      const optionCounts = {};
      mcqResponses.forEach(response => {
        const option = response.responseValue;
        optionCounts[option] = (optionCounts[option] || 0) + 1;
      });

      questionAnalytics.optionDistribution = optionCounts;
      questionAnalytics.options = question.options || [];
    } else if (question.type === 'TEXT') {
      // For text responses, just count them
      questionAnalytics.textResponseCount = questionAnalytics.responseCount;
    }

    analytics.questions.push(questionAnalytics);
  }

  // Calculate total unique responses (approximate - use max question response count)
  // Since responses are anonymous, we use the maximum response count across all questions
  analytics.totalResponses = Math.max(...analytics.questions.map(q => q.responseCount), 0);

  return analytics;
};

module.exports = {
  createSurvey,
  updateSurvey,
  getSurveyList,
  getSurveyById,
  submitSurveyResponse,
  getSurveyAnalytics
};
