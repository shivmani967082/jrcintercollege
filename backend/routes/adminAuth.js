const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');

const { checkLockout, recordFailure, recordSuccess } = require('../middleware/rateLimiter');

// POST /api/admin/login
router.post('/login', async (req, res, next) => {
  const { username } = req.body;
  if (username) {
    req.baseKey = `admin:${username.trim().toLowerCase()}`;
  }
  next();
}, checkLockout, async (req, res) => {
  try {
    const { username, password } = req.body;
    const key = req.key;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const adminUser = await Admin.findOne({ username });
    if (!adminUser) {
      await recordFailure(key);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
      await recordFailure(key);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Reset attempts on success
    await recordSuccess(key);

    // Return success to the frontend (frontend sets localStorage)
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/admin/change-password
router.post('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const adminUser = await Admin.findOne({ username });
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, adminUser.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    adminUser.password = hashedPassword;
    await adminUser.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
