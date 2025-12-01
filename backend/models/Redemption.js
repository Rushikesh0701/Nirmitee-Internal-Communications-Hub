const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rewardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RewardCatalog',
        required: true
    },
    pointsSpent: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED'],
        default: 'PENDING'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectionReason: String,
    fulfillmentNotes: String,
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    }
}, {
    timestamps: true
});

// Indexes
redemptionSchema.index({ userId: 1, createdAt: -1 });
redemptionSchema.index({ status: 1, createdAt: -1 });
redemptionSchema.index({ rewardId: 1 });

module.exports = mongoose.model('Redemption', redemptionSchema);
