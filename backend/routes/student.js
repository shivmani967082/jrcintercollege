/**
 * Student Panel - protected routes (profile, result, fees)
 * IMPORTANT: This is BACKEND code. 
 * Do NOT mix with frontend StudentPanel logic.
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { verify } = require('../utils/studentAuth');
const Student = require('../models/Student');
const StudentResult = require('../models/StudentResult');
const StudentFee = require('../models/StudentFee');

const isDbConnected = () => mongoose.connection.readyState === 1;

const getStudentId = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token || req.body?.token;
  const payload = verify(token);
  return payload && payload.studentId ? payload.studentId : null;
};

// GET /api/student/me - profile
router.get('/me', async (req, res) => {
  const studentId = getStudentId(req);
  if (!studentId) {
    return res.status(401).json({ success: false, message: 'लॉगिन जरूरी है।' });
  }
  try {
    const student = await Student.findById(studentId).select('name class rollNo createdAt');
    if (!student) return res.status(404).json({ success: false, message: 'छात्र नहीं मिला।' });
    res.json({ success: true, data: student });
  } catch (err) {
    console.error('Student me error:', err);
    res.status(500).json({ success: false, message: 'त्रुटि।' });
  }
});

// GET /api/student/result - my results
router.get('/result', async (req, res) => {
  const studentId = getStudentId(req);
  if (!studentId) return res.status(401).json({ success: false, message: 'लॉगिन जरूरी है।' });
  try {
    const results = await StudentResult.find({ student: studentId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Student result error:', err);
    res.status(500).json({ success: false, message: 'परिणाम लोड नहीं हो सके।' });
  }
});

// GET /api/student/fees - my fees
router.get('/fees', async (req, res) => {
  const studentId = getStudentId(req);
  if (!studentId) return res.status(401).json({ success: false, message: 'लॉगिन जरूरी है।' });
  try {
    const fees = await StudentFee.find({ student: studentId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: fees });
  } catch (err) {
    console.error('Student fees error:', err);
    res.status(500).json({ success: false, message: 'फीस लोड नहीं हो सके।' });
  }
});

// ---------- Admin/Teacher: list students, add result, add fee ----------

// GET /api/student/list - list all students
router.get('/list', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ success: true, data: [] });
    }
    const query = {};
    if (req.query.class) query.class = req.query.class;
    const list = await Student.find(query).select('name class rollNo passwordHash').sort({ class: 1, rollNo: 1 }).lean();
    const data = list.map(s => ({
      id: s._id,
      name: s.name,
      class: s.class,
      rollNo: s.rollNo,
      hasAccount: !!(s.passwordHash)
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('Student list error:', err);
    res.status(500).json({ success: false, message: 'छात्र सूची लोड नहीं हो सकी।' });
  }
});

// Helper: compute grade
function getGradeAndPassFail(percentage) {
  if (percentage == null || isNaN(percentage)) return { grade: '', passFail: '' };
  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 30) grade = 'D';
  const passFail = percentage >= 30 ? 'pass' : 'fail';
  return { grade, passFail };
}

// POST /api/student/add-result
router.post('/add-result', async (req, res) => {
  try {
    const { studentId, examName, session, totalMarks, obtainedMarks, percentage, grade, passFail, subjects, remarks } = req.body;
    if (!studentId || !examName) {
      return res.status(400).json({ success: false, message: 'छात्र और परीक्षा का नाम जरूरी है।' });
    }
    let pct = percentage != null ? Number(percentage) : null;
    let gr = grade || '';
    let pf = passFail || '';
    const tot = totalMarks != null ? Number(totalMarks) : null;
    const obt = obtainedMarks != null ? Number(obtainedMarks) : null;
    
    if (tot != null && tot > 0 && obt != null && !isNaN(obt)) {
      pct = Math.round((obt / tot) * 10000) / 100;
      const computed = getGradeAndPassFail(pct);
      gr = computed.grade;
      pf = computed.passFail;
    }

    const result = new StudentResult({
      student: studentId,
      examName,
      session: session || '',
      totalMarks: tot,
      obtainedMarks: obt,
      percentage: pct,
      grade: gr,
      passFail: pf || undefined,
      subjects: Array.isArray(subjects) ? subjects : [],
      remarks: remarks || (pf ? (pf === 'pass' ? 'Pass' : 'Fail') : '')
    });
    await result.save();
    res.status(201).json({ success: true, message: 'परिणाम जोड़ा गया।', data: result });
  } catch (err) {
    console.error('Add result error:', err);
    res.status(500).json({ success: false, message: 'परिणाम जोड़ने में त्रुटि।' });
  }
});

// POST /api/student/add-fee
router.post('/add-fee', async (req, res) => {
  try {
    const { studentId, amount, paid, dueDate, session, description } = req.body;
    if (!studentId || amount == null) {
      return res.status(400).json({ success: false, message: 'छात्र और राशि जरूरी है।' });
    }
    const p = Number(paid) || 0;
    const a = Number(amount) || 0;
    let status = 'pending';
    if (p >= a) status = 'paid';
    else if (p > 0) status = 'partial';

    const fee = new StudentFee({
      student: studentId,
      amount: a,
      paid: p,
      dueDate: dueDate || undefined,
      session: session || '',
      description: description || 'फीस',
      status
    });
    await fee.save();
    res.status(201).json({ success: true, message: 'फीस रिकॉर्ड जोड़ा गया।', data: fee });
  } catch (err) {
    console.error('Add fee error:', err);
    res.status(500).json({ success: false, message: 'फीस जोड़ने में त्रुटि।' });
  }
});

// GET results of a student
router.get('/:studentId/results', async (req, res) => {
  try {
    if (!isDbConnected()) return res.json({ success: true, data: [] });
    const list = await StudentResult.find({ student: req.params.studentId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Student results error:', err);
    res.status(500).json({ success: false, message: 'परिणाम लोड नहीं हो सके।' });
  }
});

// GET fees of a student
router.get('/:studentId/fees', async (req, res) => {
  try {
    if (!isDbConnected()) return res.json({ success: true, data: [] });
    const list = await StudentFee.find({ student: req.params.studentId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Student fees error:', err);
    res.status(500).json({ success: false, message: 'फीस लोड नहीं हो सके।' });
  }
});

// PATCH /api/student/result/:id
router.patch('/result/:id', async (req, res) => {
  try {
    const { examName, session, totalMarks, obtainedMarks, percentage, grade, remarks } = req.body;
    const result = await StudentResult.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'परिणाम नहीं मिला।' });

    if (examName !== undefined) result.examName = examName;
    if (session !== undefined) result.session = session;
    if (totalMarks !== undefined) result.totalMarks = Number(totalMarks);
    if (obtainedMarks !== undefined) result.obtainedMarks = Number(obtainedMarks);

    const tot = result.totalMarks;
    const obt = result.obtainedMarks;
    if (tot != null && tot > 0 && obt != null && !isNaN(obt)) {
      result.percentage = Math.round((obt / tot) * 10000) / 100;
      const computed = getGradeAndPassFail(result.percentage);
      result.grade = computed.grade;
      result.passFail = computed.passFail;
      result.remarks = result.remarks || (computed.passFail === 'pass' ? 'Pass' : 'Fail');
    } else if (percentage != null) result.percentage = Number(percentage);

    if (grade !== undefined) result.grade = grade;
    if (remarks !== undefined) result.remarks = remarks;

    await result.save();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Update result error:', err);
    res.status(500).json({ success: false, message: 'अपडेट नहीं हो पाया।' });
  }
});

// PATCH /api/student/fee/:id
router.patch('/fee/:id', async (req, res) => {
  try {
    const { amount, paid, dueDate, session, description } = req.body;
    const fee = await StudentFee.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: 'फीस रिकॉर्ड नहीं मिला।' });

    if (amount != null) fee.amount = Number(amount);
    if (paid != null) fee.paid = Number(paid);
    if (dueDate !== undefined) fee.dueDate = dueDate || undefined;
    if (session !== undefined) fee.session = session;
    if (description !== undefined) fee.description = description;

    const p = fee.paid;
    const a = fee.amount;
    fee.status = p >= a ? 'paid' : p > 0 ? 'partial' : 'pending';

    await fee.save();
    res.json({ success: true, data: fee });
  } catch (err) {
    console.error('Update fee error:', err);
    res.status(500).json({ success: false, message: 'अपडेट नहीं हो पाया।' });
  }
});

// DELETE /api/student/result/:id
router.delete('/result/:id', async (req, res) => {
  try {
    const result = await StudentResult.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'परिणाम नहीं मिला।' });
    res.json({ success: true, message: 'परिणाम हटा दिया गया।' });
  } catch (err) {
    console.error('Delete result error:', err);
    res.status(500).json({ success: false, message: 'हटाने में त्रुटि।' });
  }
});

// DELETE /api/student/fee/:id
router.delete('/fee/:id', async (req, res) => {
  try {
    const fee = await StudentFee.findByIdAndDelete(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: 'फीस रिकॉर्ड नहीं मिला।' });
    res.json({ success: true, message: 'फीस रिकॉर्ड हटा दिया गया।' });
  } catch (err) {
    console.error('Delete fee error:', err);
    res.status(500).json({ success: false, message: 'हटाने में त्रुटि।' });
  }
});

module.exports = router;