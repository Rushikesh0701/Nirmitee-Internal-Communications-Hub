const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['MENTION', 'RECOGNITION', 'GROUP_POST', 'SURVEY_PUBLISHED', 'ANNOUNCEMENT', 'COMMENT', 'LIKE', 'SYSTEM'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    link: String, // URL to navigate to when clicked
    senderUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
