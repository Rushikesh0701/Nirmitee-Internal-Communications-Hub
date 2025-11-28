const mongoose = require('mongoose');

const rssArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['AI', 'Cloud', 'DevOps', 'Programming', 'Cybersecurity'],
    trim: true
  },
  publishedAt: {
    type: Date,
    required: true
  },
  feedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RSSFeed',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
rssArticleSchema.index({ category: 1, publishedAt: -1 });
rssArticleSchema.index({ link: 1 });
rssArticleSchema.index({ feedId: 1 });

module.exports = mongoose.model('RssArticle', rssArticleSchema);

