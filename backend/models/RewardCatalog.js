const mongoose = require('mongoose');

const rewardCatalogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String,
        default: null
    },
    category: {
        type: String,
        enum: ['GIFT_CARD', 'MERCHANDISE', 'EXPERIENCE', 'TIME_OFF', 'OTHER'],
        default: 'OTHER'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    stock: {
        type: Number,
        default: null // null means unlimited
    },
    redeemedCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes
rewardCatalogSchema.index({ isActive: 1, points: 1 });
rewardCatalogSchema.index({ category: 1 });

module.exports = mongoose.model('RewardCatalog', rewardCatalogSchema);
