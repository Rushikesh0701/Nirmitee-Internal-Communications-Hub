const mongoose = require('mongoose');

const surveyQuestionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['MCQ', 'RATING', 'TEXT'],
        required: true
    },
    options: [String], // For MCQ
    required: {
        type: Boolean,
        default: false
    },
    orderIndex: {
        type: Number,
        required: true
    }
});

const surveySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'CLOSED'],
        default: 'DRAFT'
    },
    questions: [surveyQuestionSchema],
    startDate: Date,
    endDate: Date,
    isAnonymous: {
        type: Boolean,
        default: true
    },
    allowMultipleResponses: {
        type: Boolean,
        default: false
    },
    responseCount: {
        type: Number,
        default: 0
    },
    targetAudience: {
        type: String,
        enum: ['ALL', 'DEPARTMENT', 'ROLE', 'SPECIFIC_USERS'],
        default: 'ALL'
    },
    targetDepartments: [String],
    targetRoles: [String],
    targetUserIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Indexes
surveySchema.index({ status: 1, createdAt: -1 });
surveySchema.index({ createdBy: 1 });

module.exports = mongoose.model('SurveyModel', surveySchema);
