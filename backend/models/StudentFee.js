/**
 * Student Fee record - fees assigned to a student
 */

const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  dueDate: { type: Date },
  session: { type: String, trim: true },
  description: { type: String, trim: true }, // e.g. "वार्षिक फीस 2024-25"
  status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' }
}, { timestamps: true });

feeSchema.index({ student: 1 });

module.exports = mongoose.model('StudentFee', feeSchema);
