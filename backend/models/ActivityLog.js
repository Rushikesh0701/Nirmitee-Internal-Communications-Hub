const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activityType: {
        type: String,
        enum: [
            'BLOG_POST',
            'BLOG_COMMENT',
            'BLOG_LIKE',
            'DISCUSSION_CREATE',
            'DISCUSSION_REPLY',
            'POLL_VOTE',
            'POLL_CREATE',
            'COURSE_COMPLETE',
            'DAILY_LOGIN',
            'STREAK_BONUS'
        ],
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    pointsAwarded: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

// Indexes for fast lookups and cooldown checks
activityLogSchema.index({ userId: 1, activityType: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, referenceId: 1, activityType: 1 }, { unique: true, partialFilterExpression: { referenceId: { $exists: true } } });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
