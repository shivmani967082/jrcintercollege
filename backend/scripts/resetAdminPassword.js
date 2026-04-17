const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const Admin = require('../models/Admin');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Load from backend/.env

// We'll fallback to MONGODB_URI or MONGO_URI
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  console.error("No MONGODB_URI set in environment variables.");
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('MongoDB Connected');

    const username = process.argv[2] || 'admin';
    const plainPassword = process.argv[3] || 'Jrc@2025'; // Standard fallback default

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    let admin = await Admin.findOne({ username });
    if (admin) {
      admin.password = hashedPassword;
      await admin.save();
      console.log(`Password reset for ${username}`);
    } else {
      admin = new Admin({ username, password: hashedPassword });
      await admin.save();
      console.log(`Admin ${username} created`);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
