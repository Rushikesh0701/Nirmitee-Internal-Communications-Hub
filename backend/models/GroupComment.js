const mongoose = require('mongoose');

const groupCommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupPost',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupComment',
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
groupCommentSchema.index({ postId: 1, createdAt: 1 });
groupCommentSchema.index({ authorId: 1 });
groupCommentSchema.index({ mentions: 1 });

module.exports = mongoose.model('GroupComment', groupCommentSchema);

