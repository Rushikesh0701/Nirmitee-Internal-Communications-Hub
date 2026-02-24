const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        index: true
    },
    device: {
        browser: { type: String, default: 'unknown' },
        platform: { type: String, default: 'unknown' },
        appVersion: { type: String, default: '1.0.0' }
    },
    topics: {
        type: [String],
        default: ['broadcast'],
        enum: ['announcements', 'surveys', 'learning', 'recognition', 'broadcast']
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    isValid: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound unique index — one token per user
deviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

// TTL index — auto-remove tokens inactive for 60 days
deviceTokenSchema.index({ lastActive: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

// Query helper: find valid tokens for given user IDs
deviceTokenSchema.statics.findValidTokens = function (userIds) {
    return this.find({
        userId: { $in: userIds },
        isValid: true
    }).select('token userId');
};

// Query helper: find valid tokens for users with a specific topic
deviceTokenSchema.statics.findTokensByTopic = function (topic) {
    return this.find({
        topics: topic,
        isValid: true
    }).select('token userId');
};

// Mark tokens as invalid
deviceTokenSchema.statics.invalidateTokens = function (tokens) {
    return this.updateMany(
        { token: { $in: tokens } },
        { $set: { isValid: false } }
    );
};

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
