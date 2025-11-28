const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');

// Public routes (authenticated users can view)
router.get('/', authenticateToken, announcementController.getAllAnnouncements);
router.get('/:id', authenticateToken, announcementController.getAnnouncementById);

// Admin-only routes
router.post('/', authenticateToken, isAdmin, announcementController.createAnnouncement);
router.put('/:id', authenticateToken, isAdmin, announcementController.updateAnnouncement);
router.delete('/:id', authenticateToken, isAdmin, announcementController.deleteAnnouncement);

module.exports = router;

