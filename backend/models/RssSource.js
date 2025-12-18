const mongoose = require('mongoose');

const rssSourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for performance
rssSourceSchema.index({ category: 1 });
rssSourceSchema.index({ isActive: 1 });

module.exports = mongoose.model('RssSource', rssSourceSchema);
