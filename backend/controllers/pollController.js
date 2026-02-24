const pollService = require('../services/pollService');

/**
 * POST /polls — Create a new poll
 */
const createPoll = async (req, res, next) => {
    try {
        const { question, options, expiresAt, isAnonymous } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ success: false, message: 'Question is required' });
        }

        if (!options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ success: false, message: 'At least 2 options are required' });
        }

        if (options.length > 10) {
            return res.status(400).json({ success: false, message: 'Maximum 10 options allowed' });
        }

        const poll = await pollService.createPoll({
            question: question.trim(),
            options: options.map(o => (typeof o === 'string' ? o.trim() : o)),
            createdBy: req.userId,
            expiresAt,
            isAnonymous
        });

        res.status(201).json({ success: true, data: poll });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /polls — List polls
 */
const getPolls = async (req, res, next) => {
    try {
        const { page, limit, status } = req.query;
        const result = await pollService.getPolls({ page, limit, status });

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /polls/:id — Get poll by ID
 */
const getPollById = async (req, res, next) => {
    try {
        const poll = await pollService.getPollById(req.params.id, req.userId);
        res.json({ success: true, data: poll });
    } catch (error) {
        if (error.message === 'Poll not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

/**
 * POST /polls/:id/vote — Cast a vote
 */
const votePoll = async (req, res, next) => {
    try {
        const { optionIndex } = req.body;

        if (optionIndex === undefined || optionIndex === null) {
            return res.status(400).json({ success: false, message: 'optionIndex is required' });
        }

        const poll = await pollService.votePoll(req.params.id, req.userId, parseInt(optionIndex));
        res.json({ success: true, data: poll });
    } catch (error) {
        if (['Poll not found', 'This poll is closed', 'This poll has expired', 'Invalid option', 'You have already voted on this poll'].includes(error.message)) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

/**
 * PUT /polls/:id/close — Close a poll
 */
const closePoll = async (req, res, next) => {
    try {
        const poll = await pollService.closePoll(req.params.id, req.userId, req.userRole);
        res.json({ success: true, data: poll });
    } catch (error) {
        if (error.message === 'Poll not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message.includes('Only the poll creator')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        next(error);
    }
};

/**
 * DELETE /polls/:id — Delete a poll (admin)
 */
const deletePoll = async (req, res, next) => {
    try {
        const result = await pollService.deletePoll(req.params.id);
        res.json({ success: true, ...result });
    } catch (error) {
        if (error.message === 'Poll not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

module.exports = {
    createPoll,
    getPolls,
    getPollById,
    votePoll,
    closePoll,
    deletePoll
};
