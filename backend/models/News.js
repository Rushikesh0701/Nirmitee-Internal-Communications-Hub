const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String
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
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  views: {
    type: Number,
    default: 0
  },
  sourceUrl: {
    type: String,
    trim: true
  },
  sourceType: {
    type: String,
    enum: ['manual', 'rss'],
    default: 'manual'
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
newsSchema.index({ category: 1 });
newsSchema.index({ priority: 1 });
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ isPublished: 1, publishedAt: -1 });

module.exports = mongoose.model('News', newsSchema);
