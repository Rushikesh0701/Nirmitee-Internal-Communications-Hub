const mongoose = require('mongoose');

const userPointsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    pointsHistory: [{
        amount: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ['EARNED', 'REDEEMED', 'REFUNDED'],
            required: true
        },
        source: {
            type: String,
            enum: [
                'RECOGNITION', 'REDEMPTION', 'REFUND', 'ADMIN_ADJUSTMENT',
                'BLOG_POST', 'BLOG_COMMENT', 'BLOG_LIKE',
                'DISCUSSION_CREATE', 'DISCUSSION_REPLY',
                'POLL_VOTE', 'POLL_CREATE',
                'COURSE_COMPLETE', 'DAILY_LOGIN', 'STREAK_BONUS'
            ],
            required: true
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId
        },
        description: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    currentStreak: {
        type: Number,
        default: 0
    },
    lastActiveDate: {
        type: Date,
        default: null
    },
    level: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Index for quick lookups
// userId index is automatically created by unique: true
userPointsSchema.index({ totalPoints: -1 }); // For leaderboard

module.exports = mongoose.model('UserPoints', userPointsSchema);
