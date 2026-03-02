/**
 * JRC School Backend Server
 * Express.js API server for school website
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const admissionRoutes = require('./routes/admission');
const contactRoutes = require('./routes/contact');
const aiRoutes = require('./routes/ai');
const feeRoutes = require('./routes/fee');
const newsRoutes = require('./routes/news');
const studentAuthRoutes = require('./routes/studentAuth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
// const teacherProfileRoutes = require('./routes/teacherProfile');
const classTeacherRoutes = require('./routes/classTeacher');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'localhost:5500',
      'https://jrc-school-pro.onrender.com',
      '127.0.0.1:5500',
      '127.0.0.1:3000'
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow for now, restrict in production
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files - images and uploads
const staticPath = path.join(__dirname, '../jrcschool/j.r.cschool/jrcschool/pdfs//LKG');
app.use(express.static(staticPath));
console.log('📁 Serving static files from:', staticPath);

const teacherUploadsPath = path.join(__dirname, '../jrcschool/j.r.cschool/jrcschool/pdfs//LKG/uploads/teachers');
app.use('/uploads/teachers', express.static(teacherUploadsPath));
console.log('📁 Teacher images from:', teacherUploadsPath);
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'JRC School API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/admissions', admissionRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/student', studentAuthRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
// app.use('/api/teachers', teacherProfileRoutes);
app.use('/api/class-teachers', classTeacherRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to MongoDB (short timeout so server starts even if MongoDB is not running)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jrc-school', {
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Start server
 app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  const BASE_URL =
    process.env.NODE_ENV === "production"
      ? "https://jrc-school-pro.onrender.com"
      : `localhost:${PORT}`;

  console.log(`📡 API available at ${BASE_URL}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  console.log('⚠️  Starting server without database connection...');
  
  // Start server anyway (for development)
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (without database)`);
  });
});

module.exports = app;