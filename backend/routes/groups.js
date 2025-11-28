const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// Public routes (groups list)
router.get('/', groupController.getAllGroups);

// Comment routes (must come before /:id routes)
router.get('/posts/:postId/comments', authenticateToken, groupController.getPostComments);
router.post('/posts/:postId/comments', authenticateToken, groupController.createComment);
router.put('/comments/:commentId', authenticateToken, groupController.updateComment);
router.delete('/comments/:commentId', authenticateToken, groupController.deleteComment);
router.post('/comments/:commentId/like', authenticateToken, groupController.toggleCommentLike);

// Post routes (must come before /:id routes)
router.put('/posts/:postId', authenticateToken, groupController.updateGroupPost);
router.delete('/posts/:postId', authenticateToken, groupController.deleteGroupPost);
router.post('/posts/:postId/like', authenticateToken, groupController.togglePostLike);

// Group-specific routes
router.get('/:id', groupController.getGroupById);
router.get('/:id/posts', authenticateToken, groupController.getGroupPosts);
router.post('/:id/posts', authenticateToken, groupController.createGroupPost);
router.post('/:id/join', authenticateToken, groupController.joinGroup);
router.post('/:id/leave', authenticateToken, groupController.leaveGroup);

// Protected routes - Group CRUD (Admin/Moderator only)
router.post('/', authenticateToken, isModerator, groupController.createGroup);
router.put('/:id', authenticateToken, isModerator, groupController.updateGroup);
router.delete('/:id', authenticateToken, isModerator, groupController.deleteGroup);

module.exports = router;

