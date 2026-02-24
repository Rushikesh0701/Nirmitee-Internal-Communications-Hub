const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
    notificationId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        default: ''
    },
    module: {
        type: String,
        enum: ['announcements', 'surveys', 'learning', 'recognition', 'discussions', 'blogs', 'groups', 'activity', 'system'],
        required: true
    },
    type: {
        type: String,
        required: true
    },
    url: {
        type: String,
        default: ''
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    recipientCount: {
        type: Number,
        default: 0
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    deliveryStatus: {
        success: { type: Number, default: 0 },
        failure: { type: Number, default: 0 },
        invalidTokens: { type: Number, default: 0 }
    },
    totalClicks: {
        type: Number,
        default: 0
    },
    clickedBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        clickedAt: { type: Date, default: Date.now }
    }],
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    idempotencyKey: {
        type: String,
        sparse: true,
        index: true
    },
    scheduledFor: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'scheduled'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['high', 'normal'],
        default: 'normal'
    }
}, {
    timestamps: true
});

// Indexes for analytics queries
notificationLogSchema.index({ module: 1, sentAt: -1 });
notificationLogSchema.index({ status: 1, scheduledFor: 1 });
notificationLogSchema.index({ sentAt: -1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
