const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['suggestion', 'issue', 'feedback', 'other'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    status: {
        type: String,
        enum: ['received', 'under_review', 'implemented', 'dismissed'],
        default: 'received'
    },
    isAnonymous: {
        type: Boolean,
        default: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    adminNotes: {
        type: String,
        default: ''
    },
    adminReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ submittedBy: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
