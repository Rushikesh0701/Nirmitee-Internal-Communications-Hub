const feedbackService = require('../services/feedbackService');

/**
 * POST /feedback — Submit feedback
 */
const submitFeedback = async (req, res, next) => {
    try {
        const { category, title, message, isAnonymous } = req.body;

        if (!category || !['suggestion', 'issue', 'feedback', 'other'].includes(category)) {
            return res.status(400).json({ success: false, message: 'Valid category is required (suggestion, issue, feedback, other)' });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const feedback = await feedbackService.submitFeedback({
            category,
            title: title.trim(),
            message: message.trim(),
            isAnonymous: isAnonymous !== undefined ? isAnonymous : true,
            submittedBy: req.userId
        });

        res.status(201).json({ success: true, data: feedback });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /feedback — List feedback
 */
const getFeedbackList = async (req, res, next) => {
    try {
        const { page, limit, status, category } = req.query;
        const isAdmin = ['Admin', 'Moderator'].includes(req.userRole);

        const result = await feedbackService.getFeedbackList({
            page,
            limit,
            status,
            category,
            isAdmin,
            userId: req.userId
        });

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /feedback/stats — Admin dashboard stats
 */
const getFeedbackStats = async (req, res, next) => {
    try {
        const stats = await feedbackService.getFeedbackStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /feedback/:id — Get single feedback (admin)
 */
const getFeedbackById = async (req, res, next) => {
    try {
        const feedback = await feedbackService.getFeedbackById(req.params.id);
        res.json({ success: true, data: feedback });
    } catch (error) {
        if (error.message === 'Feedback not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

/**
 * PUT /feedback/:id/status — Update feedback status (admin)
 */
const updateFeedbackStatus = async (req, res, next) => {
    try {
        const { status, adminNotes } = req.body;

        if (status && !['received', 'under_review', 'implemented', 'dismissed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const feedback = await feedbackService.updateFeedbackStatus(
            req.params.id,
            { status, adminNotes },
            req.userId
        );

        res.json({ success: true, data: feedback });
    } catch (error) {
        if (error.message === 'Feedback not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

module.exports = {
    submitFeedback,
    getFeedbackList,
    getFeedbackStats,
    getFeedbackById,
    updateFeedbackStatus
};
