const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    menteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'],
        default: 'PENDING'
    },
    goals: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: Date
    }],
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    meetingFrequency: {
        type: String,
        enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'AS_NEEDED'],
        default: 'BIWEEKLY'
    },
    notes: String,
    requestMessage: String,
    rejectionReason: String
}, {
    timestamps: true
});

// Indexes
mentorshipSchema.index({ mentorId: 1, status: 1 });
mentorshipSchema.index({ menteeId: 1, status: 1 });
mentorshipSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Mentorship', mentorshipSchema);
