/**
 * Chat History Model
 * Stores AI assistant chat conversations
 */

const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatHistorySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [chatMessageSchema],
  userInfo: {
    ip: String,
    userAgent: String
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries (sessionId already unique index)
chatHistorySchema.index({ lastActivity: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
