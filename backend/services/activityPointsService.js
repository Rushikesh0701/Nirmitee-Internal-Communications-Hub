const { ActivityLog, UserPoints } = require('../models');
const logger = require('../utils/logger');

/**
 * Points configuration — single source of truth for all activity rewards
 */
const POINTS_CONFIG = {
    BLOG_POST: { points: 15, dailyLimit: 1, label: 'Blog Post' },
    BLOG_COMMENT: { points: 5, dailyLimit: 5, label: 'Blog Comment' },
    BLOG_LIKE: { points: 2, dailyLimit: 10, label: 'Blog Like' },
    DISCUSSION_CREATE: { points: 10, dailyLimit: 3, label: 'New Discussion' },
    DISCUSSION_REPLY: { points: 5, dailyLimit: 5, label: 'Discussion Reply' },
    POLL_VOTE: { points: 3, dailyLimit: 0, label: 'Poll Vote' },       // 0 = no limit
    POLL_CREATE: { points: 8, dailyLimit: 2, label: 'Create Poll' },
    COURSE_COMPLETE: { points: 20, dailyLimit: 0, label: 'Course Completed' },
    DAILY_LOGIN: { points: 5, dailyLimit: 1, label: 'Daily Login' },
    STREAK_BONUS: { points: 10, dailyLimit: 1, label: 'Streak Bonus' }
};

/**
 * Level thresholds — each level requires cumulative total points
 */
const LEVEL_THRESHOLDS = [
    { level: 1, minPoints: 0, title: 'Newcomer' },
    { level: 2, minPoints: 50, title: 'Contributor' },
    { level: 3, minPoints: 150, title: 'Active Member' },
    { level: 4, minPoints: 350, title: 'Engager' },
    { level: 5, minPoints: 600, title: 'Champion' },
    { level: 6, minPoints: 1000, title: 'Star' },
    { level: 7, minPoints: 1500, title: 'Legend' },
    { level: 8, minPoints: 2500, title: 'Hall of Fame' }
];

const STREAK_THRESHOLD = 7; // Days needed for streak bonus

/**
 * Get the start of today (midnight) in UTC
 */
const getStartOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Get the start of yesterday in UTC
 */
const getStartOfYesterday = () => {
    const today = getStartOfToday();
    return new Date(today.getTime() - 24 * 60 * 60 * 1000);
};

/**
 * Calculate user level from total points
 */
const calculateLevel = (totalPoints) => {
    let userLevel = LEVEL_THRESHOLDS[0];
    for (const threshold of LEVEL_THRESHOLDS) {
        if (totalPoints >= threshold.minPoints) {
            userLevel = threshold;
        } else {
            break;
        }
    }
    return userLevel;
};

/**
 * Get the next level threshold (for progress bar)
 */
const getNextLevel = (currentLevel) => {
    const idx = LEVEL_THRESHOLDS.findIndex(l => l.level === currentLevel);
    if (idx >= 0 && idx < LEVEL_THRESHOLDS.length - 1) {
        return LEVEL_THRESHOLDS[idx + 1];
    }
    return null; // Max level reached
};

/**
 * Award points for a platform activity.
 * Enforces daily cooldowns and prevents duplicate awards for the same reference.
 *
 * @param {string} userId
 * @param {string} activityType - One of the POINTS_CONFIG keys
 * @param {string|null} referenceId - ID of the blog/discussion/poll/module (null for login/streak)
 * @returns {Object|null} - The activity log entry, or null if cooldown/duplicate
 */
const awardActivityPoints = async (userId, activityType, referenceId = null) => {
    try {
        const config = POINTS_CONFIG[activityType];
        if (!config) {
            logger.warn('Unknown activity type for points', { activityType });
            return null;
        }

        // --- Duplicate check: same user + same reference + same type ---
        if (referenceId) {
            const existing = await ActivityLog.findOne({
                userId,
                activityType,
                referenceId
            });
            if (existing) {
                return null; // Already awarded for this specific item
            }
        }

        // --- Daily cooldown check ---
        if (config.dailyLimit > 0) {
            const todayStart = getStartOfToday();
            const todayCount = await ActivityLog.countDocuments({
                userId,
                activityType,
                createdAt: { $gte: todayStart }
            });
            if (todayCount >= config.dailyLimit) {
                return null; // Daily limit reached
            }
        }

        // --- Create the activity log entry ---
        const activityLog = await ActivityLog.create({
            userId,
            activityType,
            referenceId: referenceId || undefined,
            pointsAwarded: config.points
        });

        // --- Award points to user ---
        await UserPoints.findOneAndUpdate(
            { userId },
            {
                $inc: { totalPoints: config.points },
                $push: {
                    pointsHistory: {
                        amount: config.points,
                        type: 'EARNED',
                        source: activityType,
                        referenceId: referenceId || undefined,
                        description: `Earned ${config.points} points for: ${config.label}`,
                        timestamp: new Date()
                    }
                },
                $setOnInsert: { userId }
            },
            { new: true, upsert: true }
        );

        // --- Update user level ---
        const userPoints = await UserPoints.findOne({ userId });
        if (userPoints) {
            const levelInfo = calculateLevel(userPoints.totalPoints);
            if (userPoints.level !== levelInfo.level) {
                userPoints.level = levelInfo.level;
                await userPoints.save();
            }
        }

        logger.info('Activity points awarded', {
            userId,
            activityType,
            points: config.points,
            referenceId
        });

        return activityLog;
    } catch (error) {
        // If it's a duplicate key error (race condition), silently ignore
        if (error.code === 11000) {
            return null;
        }
        logger.error('Error awarding activity points', { error, userId, activityType });
        return null; // Don't break the calling feature if points fail
    }
};

/**
 * Check daily login and streak bonus.
 * Should be called once per successful authentication.
 *
 * @param {string} userId
 */
const checkAndAwardStreak = async (userId) => {
    try {
        // Award daily login points
        await awardActivityPoints(userId, 'DAILY_LOGIN');

        // --- Streak logic ---
        const userPoints = await UserPoints.findOne({ userId });
        if (!userPoints) return;

        const today = getStartOfToday();
        const yesterday = getStartOfYesterday();

        // Check if lastActiveDate was yesterday (continuing streak) or today (already counted)
        if (userPoints.lastActiveDate) {
            const lastActive = new Date(userPoints.lastActiveDate);
            const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

            if (lastActiveDay.getTime() === today.getTime()) {
                // Already logged in today — no streak update needed
                return;
            }

            if (lastActiveDay.getTime() === yesterday.getTime()) {
                // Consecutive day — increment streak
                userPoints.currentStreak = (userPoints.currentStreak || 0) + 1;
            } else {
                // Streak broken — reset to 1
                userPoints.currentStreak = 1;
            }
        } else {
            // First login ever
            userPoints.currentStreak = 1;
        }

        userPoints.lastActiveDate = today;
        await userPoints.save();

        // Award streak bonus if threshold met
        if (userPoints.currentStreak >= STREAK_THRESHOLD) {
            await awardActivityPoints(userId, 'STREAK_BONUS');
        }
    } catch (error) {
        logger.error('Error checking streak', { error, userId });
        // Never fail auth because of streak logic
    }
};

/**
 * Get a user's activity summary: breakdown by type, streak, level, progress
 *
 * @param {string} userId
 * @returns {Object}
 */
const getUserActivitySummary = async (userId) => {
    // Get points record
    const userPoints = await UserPoints.findOne({ userId });
    const totalPoints = userPoints?.totalPoints || 0;
    const currentStreak = userPoints?.currentStreak || 0;

    // Calculate level
    const levelInfo = calculateLevel(totalPoints);
    const nextLevel = getNextLevel(levelInfo.level);
    const levelProgress = nextLevel
        ? Math.round(((totalPoints - levelInfo.minPoints) / (nextLevel.minPoints - levelInfo.minPoints)) * 100)
        : 100;

    // Activity breakdown (all time)
    const breakdown = await ActivityLog.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId.toString()) } },
        {
            $group: {
                _id: '$activityType',
                count: { $sum: 1 },
                totalPoints: { $sum: '$pointsAwarded' }
            }
        },
        { $sort: { totalPoints: -1 } }
    ]);

    // Map breakdown to friendly format
    const activityBreakdown = breakdown.map(item => ({
        type: item._id,
        label: POINTS_CONFIG[item._id]?.label || item._id,
        count: item.count,
        totalPoints: item.totalPoints,
        pointsPerAction: POINTS_CONFIG[item._id]?.points || 0
    }));

    // This week's points
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weeklyPoints = await ActivityLog.aggregate([
        {
            $match: {
                userId: require('mongoose').Types.ObjectId.createFromHexString(userId.toString()),
                createdAt: { $gte: weekStart }
            }
        },
        { $group: { _id: null, total: { $sum: '$pointsAwarded' } } }
    ]);

    return {
        totalPoints,
        weeklyPoints: weeklyPoints[0]?.total || 0,
        currentStreak,
        streakThreshold: STREAK_THRESHOLD,
        level: {
            current: levelInfo.level,
            title: levelInfo.title,
            progress: levelProgress,
            nextLevel: nextLevel ? { level: nextLevel.level, title: nextLevel.title, pointsNeeded: nextLevel.minPoints - totalPoints } : null
        },
        activityBreakdown,
        pointsConfig: Object.entries(POINTS_CONFIG).map(([key, val]) => ({
            type: key,
            label: val.label,
            points: val.points,
            dailyLimit: val.dailyLimit || 'Unlimited'
        }))
    };
};

/**
 * Admin: Get all users' activity summaries with search, sort, and pagination.
 *
 * @param {Object} options - { page, limit, search, sortBy, sortOrder }
 * @returns {Object} - { users, pagination, platformStats }
 */
const getAllUsersActivitySummary = async (options = {}) => {
    const { page = 1, limit = 20, search = '', sortBy = 'totalPoints', sortOrder = 'desc' } = options;
    const mongoose = require('mongoose');
    const { User } = require('../models');

    // Build user query with optional search
    const userQuery = { isActive: true };
    if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        userQuery.$or = [
            { firstName: { $regex: searchRegex } },
            { lastName: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { displayName: { $regex: searchRegex } }
        ];
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(userQuery);

    // Fetch users
    const users = await User.find(userQuery)
        .select('_id firstName lastName email displayName avatar')
        .lean();

    // Get all UserPoints records
    const userIds = users.map(u => u._id);
    const allUserPoints = await UserPoints.find({ userId: { $in: userIds } }).lean();
    const pointsMap = {};
    allUserPoints.forEach(up => { pointsMap[up.userId.toString()] = up; });

    // Get activity counts per user
    const activityCounts = await ActivityLog.aggregate([
        { $match: { userId: { $in: userIds } } },
        {
            $group: {
                _id: { userId: '$userId', activityType: '$activityType' },
                count: { $sum: 1 },
                totalPoints: { $sum: '$pointsAwarded' }
            }
        }
    ]);

    // Build activity map per user
    const activityMap = {};
    activityCounts.forEach(item => {
        const uid = item._id.userId.toString();
        if (!activityMap[uid]) activityMap[uid] = [];
        activityMap[uid].push({
            type: item._id.activityType,
            label: POINTS_CONFIG[item._id.activityType]?.label || item._id.activityType,
            count: item.count,
            totalPoints: item.totalPoints
        });
    });

    // Build user summaries
    let userSummaries = users.map(user => {
        const uid = user._id.toString();
        const up = pointsMap[uid] || {};
        const totalPoints = up.totalPoints || 0;
        const levelInfo = calculateLevel(totalPoints);
        return {
            _id: uid,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            displayName: user.displayName,
            avatar: user.avatar,
            totalPoints,
            currentStreak: up.currentStreak || 0,
            lastActiveDate: up.lastActiveDate || null,
            level: levelInfo.level,
            levelTitle: levelInfo.title,
            totalActivities: (activityMap[uid] || []).reduce((sum, a) => sum + a.count, 0),
            activityBreakdown: activityMap[uid] || []
        };
    });

    // Sort
    const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
    userSummaries.sort((a, b) => {
        const aVal = a[sortBy] ?? 0;
        const bVal = b[sortBy] ?? 0;
        if (typeof aVal === 'string') return aVal.localeCompare(bVal) * sortMultiplier;
        return (aVal - bVal) * sortMultiplier;
    });

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedUsers = userSummaries.slice(skip, skip + limit);

    // Platform-wide stats
    const totalPointsAwarded = allUserPoints.reduce((sum, up) => sum + (up.totalPoints || 0), 0);
    const totalActivities = activityCounts.reduce((sum, a) => sum + a.count, 0);
    const avgPoints = totalUsers > 0 ? Math.round(totalPointsAwarded / totalUsers) : 0;

    return {
        users: paginatedUsers,
        pagination: {
            total: totalUsers,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(totalUsers / limit)
        },
        platformStats: {
            totalUsers,
            totalPointsAwarded,
            totalActivities,
            averagePointsPerUser: avgPoints
        }
    };
};

/**
 * Return the current points configuration
 */
const getPointsConfig = () => POINTS_CONFIG;

module.exports = {
    awardActivityPoints,
    checkAndAwardStreak,
    getUserActivitySummary,
    getAllUsersActivitySummary,
    getPointsConfig,
    POINTS_CONFIG,
    LEVEL_THRESHOLDS
};
