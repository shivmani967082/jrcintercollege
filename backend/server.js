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
// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://www.googletagmanager.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
      frameSrc: ["'self'", "https://www.google.com"],
    },
  },
}));
app.use(morgan('dev'));
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:3000'
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // can restrict later
    }
  },
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
const staticPath = path.join(__dirname, '..');
app.use(express.static(staticPath));
console.log('📁 Serving static files from:', staticPath);

const teacherUploadsPath = path.join(__dirname, '../frontend/assets/uploads/teachers');
// Allow cross-origin loading of uploaded images (fixes ERR_BLOCKED_BY_RESPONSE on Live Server)
app.use('/uploads/teachers', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(teacherUploadsPath));
console.log('📁 Teacher images from:', teacherUploadsPath);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'JRC School API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/admissions', admissionRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/student', studentAuthRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/class-teachers', classTeacherRoutes);
app.use('/api/admin', require('./routes/adminAuth'));

// 404
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


// ✅ SAFE MONGODB CONNECTION (FIXED)

if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);

      const BASE_URL =
        process.env.NODE_ENV === "production"
          ? process.env.RENDER_EXTERNAL_URL
          : `http://localhost:${PORT}`;

      console.log(`📡 API available at ${BASE_URL}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
    // ── Serve frontend for all non-API routes ──────────//
    app.get('*', (req, res) => {
      // Skip if it's an API route or a file with an extension (e.g. .pdf, .png, .css)
      if (!req.path.startsWith('/api') && !req.path.includes('.')) {
        res.sendFile(path.join(__dirname, '../index.html'));
      }
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // stop app if DB fails in production
  });

module.exports = app;