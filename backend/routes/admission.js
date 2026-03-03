/**
 * Admission Routes
 * Handles admission enquiry submissions
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Admission = require('../models/Admission');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');

// Helper: check if MongoDB is connected (1 = connected)
const isDbConnected = () => mongoose.connection.readyState === 1;

// Validation rules
const admissionValidation = [
  body('studentName')
    .trim()
    .notEmpty().withMessage('Student name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('classApplying')
    .notEmpty().withMessage('Class is required')
    .isIn(['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'])
    .withMessage('Invalid class selection'),
  body('parentMobile')
    .trim()
    .notEmpty().withMessage('Parent mobile number is required')
    .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit mobile number'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters')
];

/**
 * POST /api/admissions/submit
 * Submit admission enquiry
 */
router.post('/submit', admissionValidation, async (req, res) => {
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

    const { studentName, classApplying, parentMobile, message } = req.body;

    // Check for duplicate submissions (same mobile number within 24 hours)
    const recentSubmission = await Admission.findOne({
      parentMobile,
      submittedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recentSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an enquiry recently. Please wait 24 hours or contact us directly.'
      });
    }

    // Create admission record
    const admission = new Admission({
      studentName,
      classApplying,
      parentMobile,
      message: message || ''
    });

    await admission.save();

    // Send notifications (async - don't wait for completion)
    const notificationPromises = [];

    // Send WhatsApp message
    if (whatsappService.isConfigured()) {
      const whatsappMessage = `*Admission Enquiry - ${process.env.SCHOOL_NAME}*\n\n` +
        `Student Name: ${studentName}\n` +
        `Class Applying For: ${classApplying}\n` +
        `Parent Mobile: ${parentMobile}\n` +
        (message ? `Message: ${message}\n` : '') +
        `\nSubmitted via website at ${new Date().toLocaleString('en-IN')}.`;

      notificationPromises.push(
        whatsappService.sendMessage(process.env.SCHOOL_PHONE, whatsappMessage)
          .catch(err => console.error('WhatsApp notification failed:', err))
      );
    }

    // Send email notification
    if (emailService.isConfigured()) {
      const emailSubject = `New Admission Enquiry - ${studentName}`;
      const emailBody = `
        <h2>New Admission Enquiry</h2>
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Class Applying For:</strong> ${classApplying}</p>
        <p><strong>Parent Mobile:</strong> ${parentMobile}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p><strong>Submitted At:</strong> ${new Date().toLocaleString('en-IN')}</p>
      `;

      notificationPromises.push(
        emailService.sendEmail({
          to: process.env.SCHOOL_EMAIL,
          subject: emailSubject,
          html: emailBody
        }).catch(err => console.error('Email notification failed:', err))
      );
    }

    // Don't wait for notifications to complete
    Promise.all(notificationPromises).catch(err => {
      console.error('Notification errors:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Admission enquiry submitted successfully',
      data: {
        id: admission._id,
        studentName: admission.studentName,
        classApplying: admission.classApplying,
        submittedAt: admission.submittedAt
      }
    });

  } catch (error) {
    console.error('Admission submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit admission enquiry. Please try again later.'
    });
  }
});

/**
 * GET /api/admissions
 * Get all admission enquiries (admin only - add authentication in production)
 */
router.get('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        message: 'Database not connected. Start MongoDB to see admission enquiries.'
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const admissions = await Admission.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Admission.countDocuments(query);

    res.json({
      success: true,
      data: admissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admission enquiries'
    });
  }
});

/**
 * GET /api/admissions/:id
 * Get single admission enquiry
 */
router.get('/:id', async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission enquiry not found'
      });
    }

    res.json({
      success: true,
      data: admission
    });
  } catch (error) {
    console.error('Error fetching admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admission enquiry'
    });
  }
});

/**
 * PATCH /api/admissions/:id/status
 * Update admission status (admin only)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['pending', 'contacted', 'admitted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData = { status };
    if (status === 'contacted') {
      updateData.contactedAt = new Date();
    }
    if (notes) {
      updateData.notes = notes;
    }

    const admission = await Admission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission enquiry not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: admission
    });
  } catch (error) {
    console.error('Error updating admission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

/**
 * DELETE /api/admissions/:id
 * Delete admission enquiry (admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const admission = await Admission.findByIdAndDelete(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission enquiry not found'
      });
    }

    res.json({
      success: true,
      message: 'Admission record deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error('Error deleting admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete admission record'
    });
  }
});

module.exports = router;
