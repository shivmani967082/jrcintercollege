/**
 * Fee Routes (Updated with PDF Chart Data)
 * Handles fee-related queries and calculations based on 2025 Chart
 */

const express = require('express');
const router = express.Router();

// Updated Fee structure from PDF
const FEE_STRUCTURE = {
  lkg: { tuition: 350, newAdm: 500, oldAdm: 300, name: 'L.K.G. / U.K.G.' },
  primary: { tuition: 400, newAdm: 500, oldAdm: 300, name: 'Class 1st to 5th' },
  middle: { tuition: 450, newAdm: 500, oldAdm: 300, name: 'Class 6th to 8th' },
  '9th': { tuition: 500, newAdm: 800, oldAdm: 800, name: 'Class 9th' },
  '10th': { tuition: 500, newAdm: 1300, oldAdm: 1300, name: 'Class 10th' },
  '11th': { tuition: 550, newAdm: 800, oldAdm: 800, name: 'Class 11th' },
  '12th': { tuition: 550, newAdm: 1300, oldAdm: 1300, name: 'Class 12th' }
};

const EXAM_FEE_ANNUAL = 600; // 300 + 300

const TRANSPORT_MONTHLY = {
  '0': 0,
  '350': 350,
  '500': 500,
  '600': 600
};

/**
 * POST /api/fees/calculate
 * Calculate fee based on new PDF data
 */
router.post('/calculate', (req, res) => {
  try {
    const { class: classType, status = 'new', transport = '0' } = req.body;

    if (!classType || !FEE_STRUCTURE[classType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class selection'
      });
    }

    const classData = FEE_STRUCTURE[classType];
    const annualTuition = classData.tuition * 12;
    const admissionFee = (status === 'new') ? classData.newAdm : classData.oldAdm;
    const annualTransport = (TRANSPORT_MONTHLY[transport] || 0) * 12;
    
    const total = annualTuition + admissionFee + EXAM_FEE_ANNUAL + annualTransport;

    res.json({
      success: true,
      data: {
        className: classData.name,
        tuition: annualTuition,
        admission: admissionFee,
        exam: EXAM_FEE_ANNUAL,
        transport: annualTransport,
        total: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Calculation Error' });
  }
});

module.exports = router;