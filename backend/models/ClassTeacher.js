/**
 * ClassTeacher Model - for teacher panel login (class teacher only)
 * Admin registers teachers; they login with Teacher Name (as ID) + Class + Password.
 * Each teacher is assigned one class - they can only see/manage that class's students.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const CLASSES = [
  'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8',
  '9', '9-Arts', '9-Home Science', '9-Science',
  '10',
  '11-Arts', '11-Commerce', '11-Science',
  '12-Arts', '12-Commerce', '12-Science'
];

const classTeacherSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  assignedClass: {
    type: String,
    required: true,
    trim: true,
    enum: CLASSES
  },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true }
}, {
  timestamps: true
});

classTeacherSchema.index({ assignedClass: 1 });
classTeacherSchema.index({ teacherId: 1, assignedClass: 1 }, { unique: true });

classTeacherSchema.methods.setPassword = function (plainPassword) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.passwordHash = crypto.pbkdf2Sync(plainPassword, this.salt, 1000, 64, 'sha512').toString('hex');
};

classTeacherSchema.methods.verifyPassword = function (plainPassword) {
  if (!this.passwordHash || !this.salt) return false;
  const hash = crypto.pbkdf2Sync(plainPassword, this.salt, 1000, 64, 'sha512').toString('hex');
  return this.passwordHash === hash;
};

module.exports = mongoose.model('ClassTeacher', classTeacherSchema);
module.exports.CLASSES = CLASSES;