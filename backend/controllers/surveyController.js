const surveyService = require('../services/surveyService');

/**
 * POST /surveys/create - Admin only
 */
const createSurvey = async (req, res, next) => {
  try {
    const { title, description, questions } = req.body;
    const createdBy = req.userId;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title and at least one question are required'
      });
    }

    const survey = await surveyService.createSurvey({
      title,
      description,
      questions,
      createdBy
    });

    res.status(201).json({
      success: true,
      data: survey
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /surveys/:id/edit - Admin only
 */
const updateSurvey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const survey = await surveyService.updateSurvey(id, updateData);

    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    if (error.message === 'Survey not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * GET /surveys/list
 */
const getSurveyList = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await surveyService.getSurveyList({
      status,
      page,
      limit
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /surveys/:id
 */
const getSurveyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const survey = await surveyService.getSurveyById(id);

    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    if (error.message === 'Survey not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * POST /surveys/:id/submit - Anonymous
 */
const submitSurveyResponse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { responses } = req.body;

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Responses array is required'
      });
    }

    const result = await surveyService.submitSurveyResponse(id, responses);

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error.message === 'Survey not found' || error.message === 'Survey is not active') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'All questions must be answered') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * GET /surveys/:id/analytics - Admin/Moderator only
 */
const getSurveyAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const analytics = await surveyService.getSurveyAnalytics(id);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    if (error.message === 'Survey not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  createSurvey,
  updateSurvey,
  getSurveyList,
  getSurveyById,
  submitSurveyResponse,
  getSurveyAnalytics
};
