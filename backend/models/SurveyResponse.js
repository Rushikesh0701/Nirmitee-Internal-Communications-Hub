const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
    surveyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SurveyModel',
        required: true
    },
    // NO userId field - to maintain anonymity!
    responses: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        questionText: String,
        questionType: String,
        answer: mongoose.Schema.Types.Mixed, // Can be string, number, array depending on question type
        selectedOption: String // For MCQ
    }],
    submittedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: String, // Optional: for preventing spam
    userAgent: String // Optional: for analytics
}, {
    timestamps: true
});

// Indexes
surveyResponseSchema.index({ surveyId: 1, submittedAt: -1 });

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);
