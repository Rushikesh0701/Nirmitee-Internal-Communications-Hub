const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');

// Get theme config - any authenticated user can view
router.get('/theme', authenticateToken, themeController.getThemeConfig);

// Update theme config - Admin only
router.put('/theme', authenticateToken, isAdmin, themeController.updateThemeConfig);

// Reset theme to defaults - Admin only
router.post('/theme/reset', authenticateToken, isAdmin, themeController.resetThemeConfig);

module.exports = router;
