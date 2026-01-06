const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const profileController = require('../controllers/profileController');
const newsPreferencesController = require('../controllers/newsPreferencesController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// Profile routes
router.get('/profile/:id', authenticateToken, profileController.getProfile);
router.put('/profile/update', authenticateToken, profileController.updateProfile);
router.get('/profile/:id/badges', authenticateToken, profileController.getUserBadges);
router.get('/directory', authenticateToken, profileController.getDirectory);

// News preferences routes
router.get('/news-preferences', authenticateToken, newsPreferencesController.getNewsPreferences);
router.put('/news-preferences', authenticateToken, newsPreferencesController.updateNewsPreferences);

// User management routes
router.get('/search', authenticateToken, userController.searchUsersForMentions);
router.get('/', authenticateToken, isModerator, userController.getAllUsers);
router.get('/:id', authenticateToken, userController.getUserById);
router.put('/:id', authenticateToken, userController.updateUser);
router.put('/:id/role', authenticateToken, userController.updateUserRole);
router.delete('/:id/soft', authenticateToken, isModerator, userController.softDeleteUser);
router.post('/:id/restore', authenticateToken, isModerator, userController.restoreUser);
router.delete('/:id/permanent', authenticateToken, isModerator, userController.permanentDeleteUser);

module.exports = router;


