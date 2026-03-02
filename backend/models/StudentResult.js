/**
 * Student Result - exam-wise marks for a student
 */

const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examName: { type: String, required: true, trim: true }, // e.g. "अर्धवार्षिक 2024", "वार्षिक 2024"
  session: { type: String, trim: true }, // e.g. "2024-25"
  totalMarks: { type: Number },
  obtainedMarks: { type: Number },
  percentage: { type: Number },
  grade: { type: String, trim: true },
  passFail: { type: String, enum: ['pass', 'fail'], trim: true }, // auto: >=30% pass, <30% fail
  subjects: [{
    name: { type: String, trim: true },
    maxMarks: { type: Number },
    obtainedMarks: { type: Number }
  }],
  remarks: { type: String, trim: true }
}, { timestamps: true });

resultSchema.index({ student: 1, examName: 1 });

module.exports = mongoose.model('StudentResult', resultSchema);
