const mongoose = require('mongoose');

const rssCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for performance
rssCategorySchema.index({ isActive: 1 });
rssCategorySchema.index({ value: 1 });

module.exports = mongoose.model('RssCategory', rssCategorySchema);
