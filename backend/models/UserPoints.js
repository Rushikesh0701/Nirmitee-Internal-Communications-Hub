const mongoose = require('mongoose');

const userPointsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    pointsHistory: [{
        amount: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ['EARNED', 'REDEEMED', 'REFUNDED'],
            required: true
        },
        source: {
            type: String,
            enum: ['RECOGNITION', 'REDEMPTION', 'REFUND', 'ADMIN_ADJUSTMENT'],
            required: true
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId
        },
        description: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index for quick lookups
userPointsSchema.index({ userId: 1 });
userPointsSchema.index({ totalPoints: -1 }); // For leaderboard

module.exports = mongoose.model('UserPoints', userPointsSchema);
