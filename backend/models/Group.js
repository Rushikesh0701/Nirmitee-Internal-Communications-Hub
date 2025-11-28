const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  coverImage: {
    type: String
  },
  memberCount: {
    type: Number,
    default: 0
  },
  postCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
groupSchema.index({ isPublic: 1, createdAt: -1 });
groupSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Group', groupSchema);

