const mongoose = require('mongoose');

const recognitionSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  badge: {
    type: String,
    enum: ['STAR_PERFORMER', 'TEAM_PLAYER', 'INNOVATOR', 'PROBLEM_SOLVER', 'MENTOR', 'LEADER', 'HELPER', 'OTHER'],
    default: 'OTHER'
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['achievement', 'teamwork', 'innovation', 'leadership', 'customer_service', 'other'],
    default: 'achievement'
  }
}, {
  timestamps: true
});

// Indexes
recognitionSchema.index({ receiverId: 1, createdAt: -1 });
recognitionSchema.index({ senderId: 1, createdAt: -1 });
recognitionSchema.index({ createdAt: -1 });
recognitionSchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('Recognition', recognitionSchema);
