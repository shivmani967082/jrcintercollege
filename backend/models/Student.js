/**
 * Student Model - for student panel login
 * name, class, rollNo, password (hashed)
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const STUDENT_CLASSES = [
  'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8',
  '9', '9-Arts', '9-Home Science', '9-Science',
  '10',
  '11-Arts', '11-Commerce', '11-Science',
  '12-Arts', '12-Commerce', '12-Science'
];

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  class: {
    type: String,
    required: true,
    trim: true,
    enum: STUDENT_CLASSES
  },
  rollNo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  // Optional: when teacher registers student, no password. Student sets it in "Create account".
  passwordHash: { type: String },
  salt: { type: String }
}, {
  timestamps: true
});

// Unique per class + rollNo
studentSchema.index({ class: 1, rollNo: 1 }, { unique: true });

studentSchema.methods.hasPassword = function () {
  return !!(this.passwordHash && this.salt);
};

studentSchema.methods.setPassword = function (plainPassword) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.passwordHash = crypto.pbkdf2Sync(plainPassword, this.salt, 1000, 64, 'sha512').toString('hex');
};

studentSchema.methods.verifyPassword = function (plainPassword) {
  if (!this.passwordHash || !this.salt) return false;
  const hash = crypto.pbkdf2Sync(plainPassword, this.salt, 1000, 64, 'sha512').toString('hex');
  return this.passwordHash === hash;
};

module.exports = mongoose.model('Student', studentSchema);
