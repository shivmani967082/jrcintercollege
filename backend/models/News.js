/**
 * News / Announcements Model
 */

const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['notice', 'holiday', 'exam', 'event', 'general'],
    default: 'notice'
  },
  date: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

newsSchema.index({ date: -1 });
newsSchema.index({ isActive: 1 });

module.exports = mongoose.model('News', newsSchema);
