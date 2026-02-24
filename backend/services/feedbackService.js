const { Feedback } = require('../models');
const logger = require('../utils/logger');

/**
 * Submit feedback
 */
const submitFeedback = async (feedbackData) => {
    const { category, title, message, isAnonymous, submittedBy } = feedbackData;

    const feedback = await Feedback.create({
        category,
        title,
        message,
        isAnonymous: isAnonymous !== undefined ? isAnonymous : true,
        submittedBy: isAnonymous ? null : submittedBy
    });

    return feedback;
};

/**
 * Get feedback list
 * Admin: all feedback
 * User: only own non-anonymous feedback
 */
const getFeedbackList = async (options = {}) => {
    const { page = 1, limit = 12, status, category, isAdmin, userId } = options;
    const skip = (page - 1) * limit;

    const query = {};

    if (isAdmin) {
        // Admin can see all
        if (status) query.status = status;
        if (category) query.category = category;
    } else {
        // Users can only see their own non-anonymous feedback
        query.submittedBy = userId;
        query.isAnonymous = false;
        if (status) query.status = status;
    }

    const [feedbacks, total] = await Promise.all([
        Feedback.find(query)
            .populate('submittedBy', 'firstName lastName email avatar')
            .populate('adminReviewedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean(),
        Feedback.countDocuments(query)
    ]);

    return {
        feedbacks,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get feedback by ID (admin only)
 */
const getFeedbackById = async (feedbackId) => {
    const feedback = await Feedback.findById(feedbackId)
        .populate('submittedBy', 'firstName lastName email avatar')
        .populate('adminReviewedBy', 'firstName lastName email')
        .lean();

    if (!feedback) {
        throw new Error('Feedback not found');
    }

    return feedback;
};

/**
 * Update feedback status (admin only)
 */
const updateFeedbackStatus = async (feedbackId, updateData, adminUserId) => {
    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
        throw new Error('Feedback not found');
    }

    if (updateData.status) feedback.status = updateData.status;
    if (updateData.adminNotes !== undefined) feedback.adminNotes = updateData.adminNotes;
    feedback.adminReviewedBy = adminUserId;
    feedback.reviewedAt = new Date();

    await feedback.save();

    return await Feedback.findById(feedbackId)
        .populate('submittedBy', 'firstName lastName email avatar')
        .populate('adminReviewedBy', 'firstName lastName email')
        .lean();
};

/**
 * Get feedback stats (admin dashboard)
 */
const getFeedbackStats = async () => {
    const [received, underReview, implemented, dismissed, total] = await Promise.all([
        Feedback.countDocuments({ status: 'received' }),
        Feedback.countDocuments({ status: 'under_review' }),
        Feedback.countDocuments({ status: 'implemented' }),
        Feedback.countDocuments({ status: 'dismissed' }),
        Feedback.countDocuments()
    ]);

    // Category breakdown
    const byCategory = await Feedback.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    return {
        total,
        byStatus: { received, under_review: underReview, implemented, dismissed },
        byCategory: byCategory.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {})
    };
};

module.exports = {
    submitFeedback,
    getFeedbackList,
    getFeedbackById,
    updateFeedbackStatus,
    getFeedbackStats
};
