const { SurveyModel, SurveyResponse, User } = require('../models');
const mongoose = require('mongoose');

/**
 * Create a new survey with questions (MongoDB only)
 */
const createSurvey = async (surveyData) => {
  const { title, description, questions, createdBy, startDate, endDate, isAnonymous } = surveyData;

  const survey = await SurveyModel.create({
    title,
    description,
    createdBy,
    status: 'ACTIVE',
    questions: questions.map((q, index) => ({
      questionText: q.questionText,
      type: q.type,
      options: q.options || [],
      required: q.required || false,
      orderIndex: index
    })),
    startDate,
    endDate,
    isAnonymous: isAnonymous !== undefined ? isAnonymous : true
  });

  // Populate creator
  await survey.populate('createdBy', 'firstName lastName email');

  return survey;
};

/**
 * Update survey (MongoDB only)
 */
const updateSurvey = async (surveyId, updateData) => {
  const survey = await SurveyModel.findById(surveyId);

  if (!survey) {
    throw new Error('Survey not found');
  }

  const { title, description, status, questions } = updateData;

  if (title) survey.title = title;
  if (description !== undefined) survey.description = description;
  if (status) survey.status = status;

  // Update questions if provided
  if (questions) {
    survey.questions = questions.map((q, index) => ({
      questionText: q.questionText,
      type: q.type,
      options: q.options || [],
      required: q.required || false,
      orderIndex: index
    }));
  }

  await survey.save();
  await survey.populate('createdBy', 'firstName lastName email');

  return survey;
};

/**
 * Get survey list (MongoDB only)
 */
const getSurveyList = async (options = {}) => {
  const { status, page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const query = {};

  if (status) {
    query.status = status;
  }

  const total = await SurveyModel.countDocuments(query);

  const surveys = await SurveyModel.find(query)
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .lean();

  return {
    surveys,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get survey by ID with questions (MongoDB only)
 */
const getSurveyById = async (surveyId) => {
  const survey = await SurveyModel.findById(surveyId)
    .populate('createdBy', 'firstName lastName email');

  if (!survey) {
    throw new Error('Survey not found');
  }

  return survey;
};

/**
 * Submit survey response (anonymous - MongoDB only)
 */
const submitSurveyResponse = async (surveyId, responses) => {
  // Verify survey exists and is active
  const survey = await SurveyModel.findById(surveyId);

  if (!survey) {
    throw new Error('Survey not found');
  }

  if (survey.status !== 'ACTIVE') {
    throw new Error('Survey is not active');
  }

  // Validate responses
  if (responses.length !== survey.questions.length) {
    throw new Error('All questions must be answered');
  }

  // Create response document (anonymous - no userId)
  const responseDoc = {
    surveyId,
    responses: responses.map(r => ({
      questionId: r.questionId,
      questionText: r.questionText,
      questionType: r.questionType,
      answer: r.answer,
      selectedOption: r.selectedOption
    })),
    submittedAt: new Date()
  };

  await SurveyResponse.create(responseDoc);

  // Increment response count
  await SurveyModel.findByIdAndUpdate(surveyId, {
    $inc: { responseCount: 1 }
  });

  return { success: true, message: 'Response submitted successfully' };
};

/**
 * Get survey analytics (MongoDB only)
 */
const getSurveyAnalytics = async (surveyId) => {
  const survey = await SurveyModel.findById(surveyId);

  if (!survey) {
    throw new Error('Survey not found');
  }

  // Get all responses for this survey
  const responses = await SurveyResponse.find({ surveyId });

  const analytics = {
    surveyId: survey._id,
    title: survey.title,
    totalResponses: responses.length,
    questions: []
  };

  // Analyze each question
  for (const question of survey.questions) {
    const questionId = question._id.toString();

    const questionAnalytics = {
      questionId: questionId,
      questionText: question.questionText,
      type: question.type,
      responseCount: 0
    };

    // Get all answers for this question
    const answers = [];
    responses.forEach(response => {
      const answer = response.responses.find(
        r => r.questionId.toString() === questionId
      );
      if (answer) {
        answers.push(answer.answer);
        questionAnalytics.responseCount++;
      }
    });

    if (question.type === 'RATING') {
      // Calculate average rating
      const ratings = answers.filter(a => !isNaN(parseFloat(a))).map(a => parseFloat(a));

      if (ratings.length > 0) {
        questionAnalytics.averageRating = (
          ratings.reduce((a, b) => a + b, 0) / ratings.length
        ).toFixed(2);
        questionAnalytics.ratingDistribution = {
          min: Math.min(...ratings),
          max: Math.max(...ratings),
          count: ratings.length
        };
      }
    } else if (question.type === 'MCQ') {
      // Count responses per option
      const optionCounts = {};

      answers.forEach(answer => {
        optionCounts[answer] = (optionCounts[answer] || 0) + 1;
      });

      questionAnalytics.optionDistribution = optionCounts;
      questionAnalytics.options = question.options || [];
    } else if (question.type === 'TEXT') {
      // For text responses, just count them
      questionAnalytics.textResponseCount = questionAnalytics.responseCount;
      // Optionally include sample responses (first 5)
      questionAnalytics.sampleResponses = answers.slice(0, 5);
    }

    analytics.questions.push(questionAnalytics);
  }

  return analytics;
};

/**
 * Delete survey (MongoDB only)
 */
const deleteSurvey = async (surveyId) => {
  const survey = await SurveyModel.findById(surveyId);

  if (!survey) {
    throw new Error('Survey not found');
  }

  // Delete all responses
  await SurveyResponse.deleteMany({ surveyId });

  // Delete survey
  await SurveyModel.findByIdAndDelete(surveyId);

  return { success: true, message: 'Survey deleted successfully' };
};

module.exports = {
  createSurvey,
  updateSurvey,
  getSurveyList,
  getSurveyById,
  submitSurveyResponse,
  getSurveyAnalytics,
  deleteSurvey
};
