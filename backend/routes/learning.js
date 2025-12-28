const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// Course routes
router.get('/', optionalAuth, learningController.getAllCourses);
router.get('/:id', optionalAuth, learningController.getCourseById);
router.post('/', authenticateToken, isModerator, learningController.createCourse);
router.post('/:id/modules', authenticateToken, isModerator, learningController.createModule);
router.get('/:id/modules', optionalAuth, learningController.getCourseModules);
router.post('/:id/enroll', authenticateToken, learningController.enrollInCourse);
router.post('/:id/progress', authenticateToken, learningController.updateCourseProgress);
router.post('/:id/certificate', authenticateToken, learningController.generateCertificate);

// User course routes
router.get('/my/certificates', authenticateToken, learningController.getUserCertificates);
router.get('/my/enrollments', authenticateToken, learningController.getUserCourses);

// Certificate viewing (public endpoint - certificate number acts as authentication)
router.get('/certificates/:certificateNumber/view', learningController.viewCertificate);

// Mentorship routes
router.post('/mentorships', authenticateToken, learningController.createMentorship);
router.put('/mentorships/:id', authenticateToken, learningController.updateMentorshipStatus);
router.get('/mentorships/my', authenticateToken, learningController.getUserMentorships);

module.exports = router;

