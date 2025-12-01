const mongoose = require('mongoose');

const userCourseSchema = new mongoose.Schema({
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
    status: {
        type: String,
        enum: ['ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'CERTIFIED'],
        default: 'ENROLLED'
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    startedAt: Date,
    completedAt: Date,
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    completedModules: [{
        moduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module'
        },
        completedAt: {
            type: Date,
            default: Date.now
        },
        quizScore: Number
    }],
    overallScore: {
        type: Number,
        min: 0,
        max: 100
    },
    certificateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Certificate'
    }
}, {
    timestamps: true
});

// Compound index to ensure one enrollment per user per course
userCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });
userCourseSchema.index({ userId: 1, status: 1 });
userCourseSchema.index({ courseId: 1, status: 1 });

module.exports = mongoose.model('UserCourse', userCourseSchema);
