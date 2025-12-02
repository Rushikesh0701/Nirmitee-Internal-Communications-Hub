const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    certificateNumber: {
        type: String,
        required: true,
        unique: true
    },
    certificateUrl: {
        type: String,
        required: true
    },
    issuedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: null // null means no expiration
    },
    grade: {
        type: String,
        enum: ['A+', 'A', 'B+', 'B', 'C', 'PASS', 'COMPLETION'],
        default: 'COMPLETION'
    },
    finalScore: {
        type: Number,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

// Indexes
certificateSchema.index({ userId: 1, courseId: 1 });
// certificateNumber index is automatically created by unique: true
certificateSchema.index({ issuedAt: -1 });

// Generate certificate number before saving
certificateSchema.pre('save', async function (next) {
    if (!this.certificateNumber) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear();
        this.certificateNumber = `CERT-${year}-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
