const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    orderIndex: {
        type: Number,
        required: true,
        default: 0
    },
    videoUrl: String,
    content: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        comment: 'Duration in minutes'
    },
    quizQuestions: [{
        question: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'],
            default: 'MCQ'
        },
        options: [String],
        correctAnswer: String,
        points: {
            type: Number,
            default: 1
        }
    }],
    resources: [{
        title: String,
        type: {
            type: String,
            enum: ['PDF', 'LINK', 'VIDEO', 'DOCUMENT'],
            default: 'DOCUMENT'
        },
        url: String
    }]
}, {
    timestamps: true
});

// Indexes
moduleSchema.index({ courseId: 1, orderIndex: 1 });

module.exports = mongoose.model('Module', moduleSchema);
