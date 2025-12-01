const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    default: 'BEGINNER'
  },
  duration: {
    type: Number,
    required: true,
    comment: 'Duration in minutes'
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
courseSchema.index({ isPublished: 1, createdAt: -1 });
courseSchema.index({ category: 1 });
courseSchema.index({ difficulty: 1 });

module.exports = mongoose.model('Course', courseSchema);
