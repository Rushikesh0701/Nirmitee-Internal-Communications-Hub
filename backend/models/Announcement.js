const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  scheduledAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
announcementSchema.index({ scheduledAt: 1 });
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);

