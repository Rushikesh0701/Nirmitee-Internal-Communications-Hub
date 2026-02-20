const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    voteCount: {
        type: Number,
        default: 0
    }
});

const pollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    options: {
        type: [pollOptionSchema],
        required: true,
        validate: {
            validator: function (v) {
                return v.length >= 2 && v.length <= 10;
            },
            message: 'A poll must have between 2 and 10 options'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'CLOSED'],
        default: 'ACTIVE'
    },
    expiresAt: {
        type: Date,
        default: null
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    totalVotes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
pollSchema.index({ status: 1, createdAt: -1 });
pollSchema.index({ createdBy: 1 });
pollSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'ACTIVE' } });

module.exports = mongoose.model('Poll', pollSchema);
