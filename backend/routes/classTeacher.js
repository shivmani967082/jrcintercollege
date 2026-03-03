/**
 * Class Teacher routes - Admin only
 * Register class teachers, list, reset password.
 * Mounted at /api/class-teachers
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const ClassTeacher = require('../models/ClassTeacher');

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/class-teachers - list all class teachers (admin)
router.get('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'डेटाबेस कनेक्ट नहीं है।' });
    }
    const teachers = await ClassTeacher.find()
      .select('-passwordHash -salt')
      .sort({ assignedClass: 1, name: 1 })
      .lean();
    res.json({ success: true, data: teachers });
  } catch (err) {
    console.error('List class teachers error:', err);
    res.status(500).json({ success: false, message: 'सूची लोड नहीं हो सकी।' });
  }
});

// POST /api/class-teachers - register new class teacher (admin)
router.post('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'डेटाबेस कनेक्ट नहीं है।' });
    }
    const { name, assignedClass, password } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'नाम जरूरी है।' });
    }
    if (!assignedClass || !assignedClass.trim()) {
      return res.status(400).json({ success: false, message: 'कक्षा जरूरी है।' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'पासवर्ड कम से कम 6 अक्षर होना चाहिए।' });
    }
    const nameTrim = name.trim();
    const classTrim = assignedClass.trim();
    if (!ClassTeacher.CLASSES.includes(classTrim)) {
      return res.status(400).json({ success: false, message: 'अमान्य कक्षा।' });
    }
    const existing = await ClassTeacher.findOne({ teacherId: nameTrim, assignedClass: classTrim });
    if (existing) {
      return res.status(400).json({ success: false, message: 'इस कक्षा के लिए यह शिक्षक पहले से रजिस्टर है।' });
    }
    const teacher = new ClassTeacher({
      teacherId: nameTrim,
      name: nameTrim,
      assignedClass: classTrim
    });
    teacher.setPassword(String(password));
    await teacher.save();
    const data = { id: teacher._id, teacherId: teacher.teacherId, name: teacher.name, assignedClass: teacher.assignedClass };
    res.status(201).json({
      success: true,
      message: 'शिक्षक रजिस्टर हो गया। इसी नाम + कक्षा + पासवर्ड से लॉगिन कर सकते हैं।',
      data
    });
  } catch (err) {
    console.error('Register class teacher error:', err);
    res.status(500).json({ success: false, message: 'रजिस्ट्रेशन में त्रुटि।' });
  }
});

// POST /api/class-teachers/:id/reset-password - reset teacher password (admin)
router.post('/:id/reset-password', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'डेटाबेस कनेक्ट नहीं है।' });
    }
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'नया पासवर्ड कम से कम 6 अक्षर होना चाहिए।' });
    }
    const teacher = await ClassTeacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'शिक्षक नहीं मिला।' });
    }
    teacher.setPassword(String(newPassword));
    await teacher.save();
    res.json({ success: true, message: 'पासवर्ड बदल दिया गया।' });
  } catch (err) {
    console.error('Reset teacher password error:', err);
    res.status(500).json({ success: false, message: 'पासवर्ड बदलने में त्रुटि।' });
  }
});

module.exports = router;