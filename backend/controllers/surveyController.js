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
    const { status, active, page, limit } = req.query;

    let queryStatus = status;
    if (active === 'true') {
      queryStatus = 'ACTIVE';
    }

    const result = await surveyService.getSurveyList({
      status: queryStatus,
      page,
      limit
    });

    // Convert MongoDB _id to id for frontend compatibility
    if (result.surveys) {
      result.surveys = result.surveys.map(survey => ({
        ...survey,
        id: survey._id?.toString() || survey.id,
        _id: survey._id?.toString() || survey._id
      }));
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    // If database error, return empty result
    if (error.name === 'SequelizeConnectionRefusedError' || 
        error.name === 'SequelizeConnectionError' ||
        error.name === 'MongoServerError' ||
        error.name === 'MongooseError' ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('connection')) {
      return res.json({ 
        success: true, 
        data: {
          surveys: [],
          pagination: {
            total: 0,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            pages: 0
          }
        }
      });
    }
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

    // Convert MongoDB _id to id for frontend compatibility
    const surveyObj = survey.toObject ? survey.toObject() : survey;
    surveyObj.id = surveyObj._id?.toString() || surveyObj.id;
    
    // Convert question IDs as well
    if (surveyObj.questions) {
      surveyObj.questions = surveyObj.questions.map(q => ({
        ...q,
        id: q._id?.toString() || q.id,
        _id: q._id?.toString() || q._id
      }));
    }

    res.json({
      success: true,
      data: surveyObj
    });
  } catch (error) {
    if (error.message === 'Survey not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    // If database error, return not found
    if (error.name === 'SequelizeConnectionRefusedError' || 
        error.name === 'SequelizeConnectionError' ||
        error.name === 'MongoServerError' ||
        error.name === 'MongooseError' ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('connection')) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
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
