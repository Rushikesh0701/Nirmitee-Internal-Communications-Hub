const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');

// Get theme config - any authenticated user can view
router.get('/theme', authenticateToken, themeController.getThemeConfig);

// Update theme config - available to all users
router.put('/theme', authenticateToken, themeController.updateThemeConfig);

// Reset theme to defaults - available to all users
router.post('/theme/reset', authenticateToken, themeController.resetThemeConfig);

module.exports = router;
