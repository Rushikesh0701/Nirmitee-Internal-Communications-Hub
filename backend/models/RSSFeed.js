const mongoose = require('mongoose');

const rssFeedSchema = new mongoose.Schema({
  feedUrl: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['AI', 'Cloud', 'DevOps', 'Programming', 'Cybersecurity', 'HealthcareIT'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastFetchedAt: {
    type: Date
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
rssFeedSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('RSSFeed', rssFeedSchema);
