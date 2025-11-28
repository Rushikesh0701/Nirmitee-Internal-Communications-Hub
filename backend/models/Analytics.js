const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  eventType: {
    type: String,
    required: true
  },
  entityType: {
    type: String
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
