const mongoose = require('mongoose');

const discussionCommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  discussionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiscussionComment',
    default: null
  },
  likes: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DiscussionComment', discussionCommentSchema);
