const { Blog, Announcement } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHelpers');

/**
 * GET /api/admin/moderation/blogs - Get all blogs pending moderation
 */
const getPendingBlogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status = 'PENDING' } = req.query;
        const skip = (page - 1) * limit;

        const [blogs, total] = await Promise.all([
            Blog.find({ moderationStatus: status })
                .populate('authorId', 'firstName lastName email avatar')
                .populate('moderatedBy', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip),
            Blog.countDocuments({ moderationStatus: status })
        ]);

        return sendSuccess(res, {
            blogs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/admin/moderation/blogs/:id/approve - Approve a blog
 */
const approveBlog = async (req, res, next) => {
    try {
        const { id } = req.params;
        const moderatorId = req.userId;

        const blog = await Blog.findById(id);
        if (!blog) {
            return sendError(res, 'Blog not found', 404);
        }

        if (blog.moderationStatus === 'APPROVED') {
            return sendError(res, 'Blog is already approved', 400);
        }

        blog.moderationStatus = 'APPROVED';
        blog.moderatedBy = moderatorId;
        blog.moderatedAt = new Date();

        // Auto-publish approved blogs
        if (!blog.isPublished) {
            blog.isPublished = true;
            blog.publishedAt = new Date();
        }

        await blog.save();

        const updatedBlog = await Blog.findById(id)
            .populate('authorId', 'firstName lastName email avatar')
            .populate('moderatedBy', 'firstName lastName email');

        return sendSuccess(res, updatedBlog, 'Blog approved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/admin/moderation/blogs/:id/reject - Reject a blog
 */
const rejectBlog = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const moderatorId = req.userId;

        const blog = await Blog.findById(id);
        if (!blog) {
            return sendError(res, 'Blog not found', 404);
        }

        if (blog.moderationStatus === 'REJECTED') {
            return sendError(res, 'Blog is already rejected', 400);
        }

        blog.moderationStatus = 'REJECTED';
        blog.moderatedBy = moderatorId;
        blog.moderatedAt = new Date();
        blog.isPublished = false;

        await blog.save();

        const updatedBlog = await Blog.findById(id)
            .populate('authorId', 'firstName lastName email avatar')
            .populate('moderatedBy', 'firstName lastName email');

        // TODO: Send notification to author about rejection

        return sendSuccess(res, updatedBlog, 'Blog rejected');
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/moderation/announcements - Get all announcements pending moderation
 */
const getPendingAnnouncements = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status = 'PENDING' } = req.query;
        const skip = (page - 1) * limit;

        const [announcements, total] = await Promise.all([
            Announcement.find({ moderationStatus: status })
                .populate('createdBy', 'firstName lastName email avatar')
                .populate('moderatedBy', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip),
            Announcement.countDocuments({ moderationStatus: status })
        ]);

        return sendSuccess(res, {
            announcements,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/admin/moderation/announcements/:id/approve - Approve an announcement
 */
const approveAnnouncement = async (req, res, next) => {
    try {
        const { id } = req.params;
        const moderatorId = req.userId;

        const announcement = await Announcement.findById(id);
        if (!announcement) {
            return sendError(res, 'Announcement not found', 404);
        }

        if (announcement.moderationStatus === 'APPROVED') {
            return sendError(res, 'Announcement is already approved', 400);
        }

        announcement.moderationStatus = 'APPROVED';
        announcement.moderatedBy = moderatorId;
        announcement.moderatedAt = new Date();

        // Auto-publish approved announcements (if not scheduled)
        if (!announcement.isPublished && !announcement.scheduledAt) {
            announcement.isPublished = true;
            announcement.publishedAt = new Date();
        }

        await announcement.save();

        const updatedAnnouncement = await Announcement.findById(id)
            .populate('createdBy', 'firstName lastName email avatar')
            .populate('moderatedBy', 'firstName lastName email');

        return sendSuccess(res, updatedAnnouncement, 'Announcement approved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/admin/moderation/announcements/:id/reject - Reject an announcement
 */
const rejectAnnouncement = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const moderatorId = req.userId;

        const announcement = await Announcement.findById(id);
        if (!announcement) {
            return sendError(res, 'Announcement not found', 404);
        }

        if (announcement.moderationStatus === 'REJECTED') {
            return sendError(res, 'Announcement is already rejected', 400);
        }

        announcement.moderationStatus = 'REJECTED';
        announcement.moderatedBy = moderatorId;
        announcement.moderatedAt = new Date();
        announcement.isPublished = false;

        await announcement.save();

        const updatedAnnouncement = await Announcement.findById(id)
            .populate('createdBy', 'firstName lastName email avatar')
            .populate('moderatedBy', 'firstName lastName email');

        // TODO: Send notification to creator about rejection

        return sendSuccess(res, updatedAnnouncement, 'Announcement rejected');
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/moderation/stats - Get moderation statistics
 */
const getModerationStats = async (req, res, next) => {
    try {
        const [
            pendingBlogs,
            approvedBlogs,
            rejectedBlogs,
            pendingAnnouncements,
            approvedAnnouncements,
            rejectedAnnouncements
        ] = await Promise.all([
            Blog.countDocuments({ moderationStatus: 'PENDING' }),
            Blog.countDocuments({ moderationStatus: 'APPROVED' }),
            Blog.countDocuments({ moderationStatus: 'REJECTED' }),
            Announcement.countDocuments({ moderationStatus: 'PENDING' }),
            Announcement.countDocuments({ moderationStatus: 'APPROVED' }),
            Announcement.countDocuments({ moderationStatus: 'REJECTED' })
        ]);

        return sendSuccess(res, {
            blogs: {
                pending: pendingBlogs,
                approved: approvedBlogs,
                rejected: rejectedBlogs,
                total: pendingBlogs + approvedBlogs + rejectedBlogs
            },
            announcements: {
                pending: pendingAnnouncements,
                approved: approvedAnnouncements,
                rejected: rejectedAnnouncements,
                total: pendingAnnouncements + approvedAnnouncements + rejectedAnnouncements
            },
            totalPending: pendingBlogs + pendingAnnouncements
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPendingBlogs,
    approveBlog,
    rejectBlog,
    getPendingAnnouncements,
    approveAnnouncement,
    rejectAnnouncement,
    getModerationStats
};
