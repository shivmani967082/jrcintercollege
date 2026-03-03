/**
 * Student Auth - Register & Login + Teacher register student
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { sign } = require('../utils/studentAuth');

const classEnum = [
  'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8',
  '9', '9-Arts', '9-Home Science', '9-Science',
  '10',
  '11-Arts', '11-Commerce', '11-Science',
  '12-Arts', '12-Commerce', '12-Science'
];
const isDbConnected = () => mongoose.connection.readyState === 1;

// POST /api/student/register-by-teacher - teacher registers student (name, rollNo, class). Must be before /register.
router.post('/register-by-teacher', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'डेटाबेस कनेक्ट नहीं है।' });
    }
    const { name, class: cls, rollNo } = req.body;
    if (!name || !cls || !rollNo) {
      return res.status(400).json({ success: false, message: 'नाम, कक्षा और रोल नंबर जरूरी हैं।' });
    }
    const nameTrim = String(name).trim();
    const classTrim = String(cls).trim();
    const rollTrim = String(rollNo).trim();
    if (!classEnum.includes(classTrim)) {
      return res.status(400).json({ success: false, message: 'अमान्य कक्षा।' });
    }
    const existing = await Student.findOne({ class: classTrim, rollNo: rollTrim });
    if (existing) {
      return res.status(400).json({ success: false, message: 'इस कक्षा में यह रोल नंबर पहले से रजिस्टर है।' });
    }
    const student = new Student({ name: nameTrim, class: classTrim, rollNo: rollTrim });
    await student.save();
    return res.status(201).json({
      success: true,
      message: 'छात्र रजिस्टर हो गया। अब छात्र पोर्टल से खाता बना सकता है।',
      data: { id: student._id, name: student.name, class: student.class, rollNo: student.rollNo }
    });
  } catch (err) {
    console.error('Teacher register student error:', err);
    res.status(500).json({ success: false, message: 'रजिस्ट्रेशन में त्रुटि।' });
  }
});

// POST /api/student/register - Only for students already registered by teacher (name case-sensitive)
router.post('/register', [
  body('name').trim().notEmpty().withMessage('नाम जरूरी है').isLength({ max: 100 }),
  body('class').trim().notEmpty().withMessage('कक्षा जरूरी है').isIn(classEnum),
  body('rollNo').trim().notEmpty().withMessage('रोल नंबर जरूरी है'),
  body('password').isLength({ min: 6 }).withMessage('पासवर्ड कम से कम 6 अक्षर का होना चाहिए'),
  body('confirmPassword').custom((val, { req }) => val === req.body.password || Promise.reject('पासवर्ड मेल नहीं खाते'))
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }
    const { name, class: cls, rollNo, password } = req.body;
    // Case-sensitive name match: only teacher-registered student can create account
    const existing = await Student.findOne({
      name: name, // exact case-sensitive
      class: cls,
      rollNo: String(rollNo).trim()
    });
    if (!existing) {
      return res.status(400).json({ success: false, message: 'इस नाम, कक्षा व रोल नंबर से कोई छात्र रजिस्टर नहीं है। पहले शिक्षक द्वारा स्टूडेंट रजिस्ट्रेशन करवाएं।' });
    }
    if (existing.hasPassword && existing.hasPassword()) {
      return res.status(400).json({ success: false, message: 'इस छात्र का खाता पहले से बन चुका है। लॉगिन करें।' });
    }
    existing.setPassword(password);
    await existing.save();
    const token = sign({ studentId: existing._id.toString() });
    return res.status(201).json({
      success: true,
      message: 'खाता बन गया। अब लॉगिन करें।',
      token,
      student: { id: existing._id, name: existing.name, class: existing.class, rollNo: existing.rollNo }
    });
  } catch (err) {
    console.error('Student register error:', err);
    res.status(500).json({ success: false, message: 'रजिस्ट्रेशन में त्रुटि।' });
  }
});

// POST /api/student/login
router.post('/login', [
  body('class').trim().notEmpty().withMessage('कक्षा जरूरी है'),
  body('rollNo').trim().notEmpty().withMessage('रोल नंबर जरूरी है'),
  body('password').notEmpty().withMessage('पासवर्ड जरूरी है')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    const { class: cls, rollNo, password } = req.body;
    const student = await Student.findOne({ class: cls, rollNo: String(rollNo).trim() });
    if (!student || !student.verifyPassword(password)) {
      return res.status(401).json({ success: false, message: 'गलत कक्षा, रोल नंबर या पासवर्ड।' });
    }
    const token = sign({ studentId: student._id.toString() });
    return res.json({
      success: true,
      token,
      student: { id: student._id, name: student.name, class: student.class, rollNo: student.rollNo }
    });
  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ success: false, message: 'लॉगिन में त्रुटि।' });
  }
});

module.exports = router;
