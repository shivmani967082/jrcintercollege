/**
 * News / Announcements Routes
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const News = require('../models/News');

const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/news - Public: get active news (for home page)
router.get('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ success: true, data: [] });
    }
    const { limit = 10 } = req.query;
    const news = await News.find({ isActive: true })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .select('-__v');
    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ success: false, message: 'सूचनाएं लोड नहीं हो सकीं।' });
  }
});

// GET /api/news/all - Admin: get all news
router.get('/all', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ success: true, data: [] });
    }
    const news = await News.find().sort({ date: -1 }).select('-__v');
    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ success: false, message: 'सूचनाएं लोड नहीं हो सकीं।' });
  }
});

// POST /api/news - Admin: add news
router.post('/', [
  body('title').trim().notEmpty().withMessage('शीर्षक जरूरी है'),
  body('content').trim().notEmpty().withMessage('विषय जरूरी है')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { title, content, type } = req.body;
    const news = new News({ title, content, type: type || 'notice' });
    await news.save();
    res.status(201).json({ success: true, message: 'सूचना जोड़ी गई।', data: news });
  } catch (error) {
    console.error('Error adding news:', error);
    res.status(500).json({ success: false, message: 'सूचना जोड़ने में त्रुटि।' });
  }
});

// PATCH /api/news/:id - Admin: update news
router.patch('/:id', async (req, res) => {
  try {
    const { title, content, type, isActive } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (type !== undefined) update.type = type;
    if (isActive !== undefined) update.isActive = isActive;
    const news = await News.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!news) return res.status(404).json({ success: false, message: 'सूचना नहीं मिली।' });
    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ success: false, message: 'अपडेट में त्रुटि।' });
  }
});

// DELETE /api/news/:id - Admin: delete news
router.delete('/:id', async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'सूचना नहीं मिली।' });
    res.json({ success: true, message: 'सूचना हटाई गई।' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ success: false, message: 'हटाने में त्रुटि।' });
  }
});

module.exports = router;
