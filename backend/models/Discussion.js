const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
discussionSchema.index({ category: 1 });
discussionSchema.index({ isPinned: -1, createdAt: -1 });
discussionSchema.index({ authorId: 1 });
discussionSchema.index({ tags: 1 });

module.exports = mongoose.model('Discussion', discussionSchema);
