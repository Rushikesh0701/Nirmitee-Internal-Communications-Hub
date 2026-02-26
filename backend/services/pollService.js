const { Poll, PollVote } = require('../models');
const activityPointsService = require('./activityPointsService');
const logger = require('../utils/logger');

/**
 * Create a new poll
 */
const createPoll = async (pollData) => {
    const { question, options, createdBy, expiresAt, isAnonymous } = pollData;

    const poll = await Poll.create({
        question,
        options: options.map(text => ({ text, voteCount: 0 })),
        createdBy: isAnonymous ? null : createdBy,
        expiresAt: expiresAt || null,
        isAnonymous: isAnonymous || false
    });

    if (!isAnonymous) {
        await poll.populate('createdBy', 'firstName lastName email avatar');
    }

    // Award activity points for creating a poll
    if (createdBy) {
        try {
            await activityPointsService.awardActivityPoints(createdBy.toString(), 'POLL_CREATE', poll._id.toString());
        } catch (error) {
            logger.error('Error awarding poll create points', { error });
        }
    }

    return poll;
};

/**
 * Get polls (paginated), auto-close expired polls
 */
const getPolls = async (options = {}) => {
    const { page = 1, limit = 12, status } = options;
    const skip = (page - 1) * limit;

    // Auto-close expired polls
    await Poll.updateMany(
        { status: 'ACTIVE', expiresAt: { $ne: null, $lte: new Date() } },
        { $set: { status: 'CLOSED' } }
    );

    const query = {};
    if (status) {
        query.status = status;
    }

    const [polls, total] = await Promise.all([
        Poll.find(query)
            .populate('createdBy', 'firstName lastName email avatar')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean(),
        Poll.countDocuments(query)
    ]);

    // Strip creator info from anonymous polls
    const sanitizedPolls = polls.map(poll => {
        if (poll.isAnonymous) {
            poll.createdBy = null;
        }
        return poll;
    });

    return {
        polls: sanitizedPolls,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get poll by ID with user's vote
 */
const getPollById = async (pollId, userId) => {
    const poll = await Poll.findById(pollId)
        .populate('createdBy', 'firstName lastName email avatar')
        .lean();

    if (!poll) {
        throw new Error('Poll not found');
    }

    // Check if expired and auto-close
    if (poll.status === 'ACTIVE' && poll.expiresAt && new Date(poll.expiresAt) <= new Date()) {
        await Poll.findByIdAndUpdate(pollId, { status: 'CLOSED' });
        poll.status = 'CLOSED';
    }

    // Check if user has voted
    if (userId) {
        const vote = await PollVote.findOne({ pollId, userId });
        poll.userVote = vote ? vote.optionIndex : null;
        poll.hasVoted = !!vote;
    }

    // Strip creator info for anonymous polls
    if (poll.isAnonymous) {
        poll.createdBy = null;
    }

    return poll;
};

/**
 * Vote on a poll
 */
const votePoll = async (pollId, userId, optionIndex) => {
    const poll = await Poll.findById(pollId);

    if (!poll) {
        throw new Error('Poll not found');
    }

    if (poll.status !== 'ACTIVE') {
        throw new Error('This poll is closed');
    }

    // Check expiry
    if (poll.expiresAt && new Date(poll.expiresAt) <= new Date()) {
        await Poll.findByIdAndUpdate(pollId, { status: 'CLOSED' });
        throw new Error('This poll has expired');
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
        throw new Error('Invalid option');
    }

    // Check if already voted
    const existingVote = await PollVote.findOne({ pollId, userId });
    if (existingVote) {
        throw new Error('You have already voted on this poll');
    }

    // Record vote
    await PollVote.create({ pollId, userId, optionIndex });

    // Increment vote count atomically
    await Poll.findByIdAndUpdate(pollId, {
        $inc: {
            totalVotes: 1,
            [`options.${optionIndex}.voteCount`]: 1
        }
    });

    // Award activity points for voting
    try {
        await activityPointsService.awardActivityPoints(userId.toString(), 'POLL_VOTE', pollId.toString());
    } catch (error) {
        logger.error('Error awarding poll vote points', { error });
    }

    // Return updated poll
    return await getPollById(pollId, userId);
};

/**
 * Close a poll (creator or admin)
 */
const closePoll = async (pollId, userId, userRole) => {
    const poll = await Poll.findById(pollId);

    if (!poll) {
        throw new Error('Poll not found');
    }

    const isCreator = poll.createdBy && poll.createdBy.toString() === userId.toString();
    const isAdmin = ['Admin', 'Moderator'].includes(userRole);

    // Anonymous polls can only be closed by admins
    if (poll.isAnonymous && !isAdmin) {
        throw new Error('Only admins can close anonymous polls');
    }

    if (!isCreator && !isAdmin) {
        throw new Error('Only the poll creator or admins can close this poll');
    }

    poll.status = 'CLOSED';
    await poll.save();

    return poll;
};

/**
 * Delete a poll (admin only)
 */
const deletePoll = async (pollId) => {
    const poll = await Poll.findById(pollId);

    if (!poll) {
        throw new Error('Poll not found');
    }

    await Promise.all([
        PollVote.deleteMany({ pollId }),
        Poll.findByIdAndDelete(pollId)
    ]);

    return { success: true, message: 'Poll deleted successfully' };
};

module.exports = {
    createPoll,
    getPolls,
    getPollById,
    votePoll,
    closePoll,
    deletePoll
};
