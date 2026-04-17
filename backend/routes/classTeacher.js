/**
 * Class Teacher routes - Admin only
 * Register class teachers, list, reset password.
 * Mounted at /api/class-teachers
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const ClassTeacher = require('../models/ClassTeacher');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Setup Multer for profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../frontend/assets/uploads/teachers');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'teacher-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// GET /api/class-teachers/public - list safe teacher info (public)
router.get('/public', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'डेटाबेस कनेक्ट नहीं है।' });
    }
    const teachers = await ClassTeacher.find()
      .select('name profilePicture subject qualification experience')
      .sort({ name: 1 })
      .lean();
    // Build full URL for profilePicture so frontend on any port can load it
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const data = teachers.map(t => ({
      ...t,
      profilePicture: t.profilePicture ? `${baseUrl}${t.profilePicture}` : ''
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('List public teachers error:', err);
    res.status(500).json({ success: false, message: 'सूची लोड नहीं हो सकी।' });
  }
});

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

// GET /api/class-teachers/classes - get list of all available classes
router.get('/classes', (req, res) => {
  res.json({ success: true, data: ClassTeacher.CLASSES });
});

// GET /api/class-teachers/check-class - check if a class already has a class teacher assigned
router.get('/check-class', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'डेटाबेस कनेक्ट नहीं है।' });
    }
    const cls = req.query.class;
    if (!cls) return res.json({ taken: false });
    const query = { assignedClass: cls.trim() };
    if (req.query.excludeId) {
      query._id = { $ne: req.query.excludeId };
    }
    const existing = await ClassTeacher.findOne(query).select('name assignedClass').lean();
    if (existing) {
      return res.json({ taken: true, teacherName: existing.name, assignedClass: existing.assignedClass });
    }
    res.json({ taken: false });
  } catch (err) {
    console.error('Check class error:', err);
    res.status(500).json({ success: false, message: 'त्रुटि।' });
  }
});

// GET /api/class-teachers/:id - get single teacher details (admin, for edit pre-fill)
router.get('/:id', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'डेटाबेस कनेक्ट नहीं है।' });
    }
    const teacher = await ClassTeacher.findById(req.params.id)
      .select('-passwordHash -salt')
      .lean();
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'शिक्षक नहीं मिला।' });
    }
    res.json({ success: true, data: teacher });
  } catch (err) {
    console.error('Get teacher by id error:', err);
    res.status(500).json({ success: false, message: 'शिक्षक जानकारी लोड नहीं हो सकी।' });
  }
});

// POST /api/class-teachers - register new class teacher (admin)
router.post('/', upload.single('profilePicture'), async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'डेटाबेस कनेक्ट नहीं है।' });
    }
    const { name, assignedClass, password, subject, qualification, experience, id, designation, thought, order, additionalAccess } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'नाम जरूरी है।' });
    }
    if (!assignedClass || !assignedClass.trim()) {
      return res.status(400).json({ success: false, message: 'कक्षा जरूरी है।' });
    }
    // If it's a new teacher (no id), password is required
    if (!id && (!password || String(password).length < 6)) {
      return res.status(400).json({ success: false, message: 'पासवर्ड कम से कम 6 अक्षर होना चाहिए।' });
    }
    const nameTrim = name.trim();
    const classTrim = assignedClass.trim();
    if (!ClassTeacher.CLASSES.includes(classTrim)) {
      return res.status(400).json({ success: false, message: 'अमान्य कक्षा।' });
    }

    let teacher;
    let profilePicturePath = req.file ? `/uploads/teachers/${req.file.filename}` : '';

    if (id) {
       teacher = await ClassTeacher.findById(id);
       if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
       // check class clash if changed
       if (teacher.assignedClass !== classTrim || teacher.teacherId !== nameTrim) {
           const existing = await ClassTeacher.findOne({ teacherId: nameTrim, assignedClass: classTrim, _id: { $ne: id } });
           if (existing) return res.status(400).json({ success: false, message: 'इस कक्षा के लिए यह शिक्षक पहले से रजिस्टर है।' });
       }
       teacher.name = nameTrim;
       teacher.teacherId = nameTrim;
       teacher.assignedClass = classTrim;
       if (subject) teacher.subject = subject.trim();
       if (qualification) teacher.qualification = qualification.trim();
       if (experience) teacher.experience = experience.trim();
       if (designation) teacher.designation = designation ? designation.trim() : '';
       if (thought) teacher.thought = thought ? thought.trim() : '';
       if (order !== undefined) teacher.order = parseInt(order) || 0;
       if (additionalAccess !== undefined) {
         try { teacher.additionalAccess = typeof additionalAccess === 'string' ? JSON.parse(additionalAccess) : (Array.isArray(additionalAccess) ? additionalAccess : []); } catch(e) { teacher.additionalAccess = additionalAccess ? String(additionalAccess).split(',').map(s=>s.trim()).filter(Boolean) : []; }
       }
       if (profilePicturePath) teacher.profilePicture = profilePicturePath;
       if (password) teacher.setPassword(String(password));
    } else {
        const existing = await ClassTeacher.findOne({ teacherId: nameTrim, assignedClass: classTrim });
        if (existing) {
          return res.status(400).json({ success: false, message: 'इस कक्षा के लिए यह शिक्षक पहले से रजिस्टर है।' });
        }
        teacher = new ClassTeacher({
          teacherId: nameTrim,
          name: nameTrim,
          assignedClass: classTrim,
          subject: subject ? subject.trim() : '',
          qualification: qualification ? qualification.trim() : '',
          experience: experience ? experience.trim() : '',
          designation: designation ? designation.trim() : '',
          thought: thought ? thought.trim() : '',
          order: order ? parseInt(order) : 0,
          additionalAccess: (() => { try { return typeof additionalAccess === 'string' ? JSON.parse(additionalAccess) : (Array.isArray(additionalAccess) ? additionalAccess : []); } catch(e) { return additionalAccess ? String(additionalAccess).split(',').map(s=>s.trim()).filter(Boolean) : []; } })(),
          profilePicture: profilePicturePath
        });
        teacher.setPassword(String(password));
    }
    
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

// PATCH /api/class-teachers/:id - update an existing class teacher (admin)
router.patch('/:id', upload.single('profilePicture'), async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'डेटाबेस कनेक्ट नहीं है।' });
    }
    const teacher = await ClassTeacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'शिक्षक नहीं मिला।' });
    }
    const { name, assignedClass, password, subject, qualification, experience, additionalAccess } = req.body;

    if (name && name.trim()) {
      teacher.name = name.trim();
      teacher.teacherId = name.trim();
    }
    if (assignedClass && assignedClass.trim()) {
      const classTrim = assignedClass.trim();
      if (!ClassTeacher.CLASSES.includes(classTrim)) {
        return res.status(400).json({ success: false, message: 'अमान्य कक्षा।' });
      }
      teacher.assignedClass = classTrim;
    }
    if (subject !== undefined) teacher.subject = subject.trim();
    if (qualification !== undefined) teacher.qualification = qualification.trim();
    if (experience !== undefined) teacher.experience = experience.trim();
    if (additionalAccess !== undefined) {
      try { teacher.additionalAccess = typeof additionalAccess === 'string' ? JSON.parse(additionalAccess) : (Array.isArray(additionalAccess) ? additionalAccess : []); } catch(e) { teacher.additionalAccess = additionalAccess ? String(additionalAccess).split(',').map(s=>s.trim()).filter(Boolean) : []; }
    }
    if (req.file) {
      // Delete old profile picture if it exists
      if (teacher.profilePicture) {
        const oldPath = path.join(__dirname, '../../frontend/assets', teacher.profilePicture);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      teacher.profilePicture = `/uploads/teachers/${req.file.filename}`;
    }
    if (password && String(password).length >= 6) {
      teacher.setPassword(String(password));
    }

    await teacher.save();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      message: 'शिक्षक अपडेट हो गया।',
      data: {
        _id: teacher._id,
        teacherId: teacher.teacherId,
        name: teacher.name,
        assignedClass: teacher.assignedClass,
        subject: teacher.subject,
        qualification: teacher.qualification,
        experience: teacher.experience,
        profilePicture: teacher.profilePicture ? `${baseUrl}${teacher.profilePicture}` : ''
      }
    });
  } catch (err) {
    console.error('Update class teacher error:', err);
    res.status(500).json({ success: false, message: 'अपडेट में त्रुटि।' });
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

// DELETE /api/class-teachers/:id - delete a teacher (admin)
router.delete('/:id', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'डेटाबेस कनेक्ट नहीं है।' });
    }
    const teacher = await ClassTeacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'शिक्षक नहीं मिला।' });
    }
    // Delete their profile picture file if it exists
    if (teacher.profilePicture) {
       // teacher.profilePicture is like /uploads/teachers/teacher-123.jpg
       const fileName = path.basename(teacher.profilePicture);
       const filePath = path.join(__dirname, '../../frontend/assets/uploads/teachers', fileName);
       if (fs.existsSync(filePath)) {
           fs.unlinkSync(filePath);
       }
    }
    await ClassTeacher.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'शिक्षक हटा दिया गया।' });
  } catch (err) {
    console.error('Delete class teacher error:', err);
    res.status(500).json({ success: false, message: 'हटाने में त्रुटि।' });
  }
});

module.exports = router;