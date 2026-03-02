/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

const nodemailer = require('nodemailer');

let transporter = null;

// Initialize email transporter
function initTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service configuration error:', error.message);
        console.log('⚠️  Email notifications will be disabled');
      } else {
        console.log('✅ Email service configured successfully');
      }
    });
  } else {
    console.log('⚠️  Email credentials not configured. Email notifications disabled.');
  }
}

// Check if email service is configured
function isConfigured() {
  return transporter !== null;
}

// Send email
async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!isConfigured()) {
    throw new Error('Email service is not configured');
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    ...(replyTo && { replyTo })
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}

// Initialize on module load
initTransporter();

module.exports = {
  sendEmail,
  isConfigured,
  initTransporter
};
