const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  attempts: { 
    type: Number, 
    default: 0 
  },
  lockoutUntil: { 
    type: Date, 
    default: null 
  },
  lastAttempt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// TTL index to automatically remove old attempts after 24 hours of inactivity
loginAttemptSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
