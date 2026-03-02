/**
 * Contact Routes
 * Handles contact form submissions
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const emailService = require('../services/emailService');

// Validation rules
const contactValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Subject cannot exceed 200 characters'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters')
];

/**
 * POST /api/contact/submit
 * Submit contact form
 */
router.post('/submit', contactValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, subject, message } = req.body;

    // Create contact record
    const contact = new Contact({
      name,
      email: email || '',
      phone: phone || '',
      subject: subject || 'General Inquiry',
      message
    });

    await contact.save();

    // Send email notification
    if (emailService.isConfigured()) {
      const emailSubject = `Contact Form: ${subject || 'General Inquiry'}`;
      const emailBody = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p><strong>Submitted At:</strong> ${new Date().toLocaleString('en-IN')}</p>
      `;

      emailService.sendEmail({
        to: process.env.SCHOOL_EMAIL,
        subject: emailSubject,
        html: emailBody,
        replyTo: email
      }).catch(err => console.error('Email notification failed:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: {
        id: contact._id,
        name: contact.name,
        submittedAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again later.'
    });
  }
});

/**
 * GET /api/contact
 * Get all contact submissions (admin only)
 */
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact submissions'
    });
  }
});

module.exports = router;
