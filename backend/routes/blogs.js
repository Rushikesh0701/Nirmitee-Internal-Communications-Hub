const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, blogController.getAllBlogs);
router.get('/:id/analytics', authenticateToken, blogController.getBlogAnalytics);
router.get('/:id', authenticateToken, blogController.getBlogById);
router.post('/', authenticateToken, blogController.createBlog);
router.put('/:id', authenticateToken, blogController.updateBlog);
router.delete('/:id', authenticateToken, blogController.deleteBlog);
router.post('/:id/like', authenticateToken, blogController.likeBlog);
router.post('/:id/comments', authenticateToken, blogController.addComment);
router.delete('/:id/comments/:commentId', authenticateToken, blogController.deleteComment);

module.exports = router;

