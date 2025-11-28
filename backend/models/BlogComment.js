const mongoose = require('mongoose');

const blogCommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogComment',
    default: null
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
blogCommentSchema.index({ blogId: 1, createdAt: -1 });
blogCommentSchema.index({ authorId: 1 });

module.exports = mongoose.model('BlogComment', blogCommentSchema);

