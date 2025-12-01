const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// Public/authenticated routes
router.get('/', optionalAuth, surveyController.getSurveyList);
router.get('/:id', optionalAuth, surveyController.getSurveyById);
router.post('/:id/submit', surveyController.submitSurveyResponse); // Anonymous submission

// Admin/Moderator routes
router.post('/create', authenticateToken, isModerator, surveyController.createSurvey);
router.put('/:id/edit', authenticateToken, isModerator, surveyController.updateSurvey);
router.get('/:id/analytics', authenticateToken, isModerator, surveyController.getSurveyAnalytics);

module.exports = router;

