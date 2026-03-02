/**
 * Admission Enquiry Model
 * Stores admission enquiry submissions
 */

const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  classApplying: {
    type: String,
    required: [true, 'Class is required'],
    enum: ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
  },
  parentMobile: {
    type: String,
    required: [true, 'Parent mobile number is required'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'admitted', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  contactedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
admissionSchema.index({ parentMobile: 1 });
admissionSchema.index({ status: 1 });
admissionSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('Admission', admissionSchema);
