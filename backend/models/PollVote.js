const mongoose = require('mongoose');

const pollVoteSchema = new mongoose.Schema({
    pollId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Poll',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    optionIndex: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

// Prevent double voting — one vote per user per poll
pollVoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('PollVote', pollVoteSchema);
