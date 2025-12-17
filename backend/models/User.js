const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function () {
      return !this.oauthProvider; // Password required only if not OAuth user
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  oauthProvider: {
    type: String,
    enum: ['google', 'github']
  },
  oauthId: {
    type: String
  },
  // Rate limiting fields
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  loginAttemptsHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      enum: [
        'invalid_password',
        'account_locked',
        'account_inactive',
        'forgot_password',
        'oauth_required',
        'user_not_found',
        'other'
      ],
      required: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  }],
  // Password reset fields
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  // Soft delete fields
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual field to check if account is locked
userSchema.virtual('isLocked').get(function () {
  // Check if lockUntil exists and is in the future
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts and lock account if threshold exceeded
userSchema.methods.incrementLoginAttempts = async function (reason = 'invalid_password', metadata = {}) {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

  // If lock has expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
      $push: {
        loginAttemptsHistory: {
          timestamp: new Date(),
          reason,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        }
      }
    });
  }

  // Increment attempts
  const updates = {
    $inc: { loginAttempts: 1 },
    $push: {
      loginAttemptsHistory: {
        timestamp: new Date(),
        reason,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      }
    }
  };

  // Lock account if max attempts reached
  const attemptsAfterIncrement = this.loginAttempts + 1;
  if (attemptsAfterIncrement >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: {
      loginAttempts: 0,
      loginAttemptsHistory: [] // Clear history on successful login
    },
    $unset: { lockUntil: 1 }
  });
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
