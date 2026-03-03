# MongoDB और Backend Setup Guide

## 📋 Requirements

- Node.js (v14 या उच्चतर)
- MongoDB (v4.4 या उच्चतर)
- npm या yarn

## 🚀 Setup Steps

### 1. MongoDB Install करें (अगर नहीं है)

#### macOS (Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
```

#### Manual Install:
[MongoDB Download](https://www.mongodb.com/try/download/community)

### 2. MongoDB Start करें

```bash
# Option 1: Script use करें
chmod +x start-mongodb.sh
./start-mongodb.sh

# Option 2: Manual start
mongod --dbpath ~/data/db
```

### 3. Dependencies Install करें

```bash
cd backend
npm install
```

### 4. Environment Variables Setup करें

`.env` file already बना हुआ है। अगर changes चाहिए तो edit करें:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/jrc-school

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=localhost:5500
```

### 5. Backend Server Start करें

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server `https://jrcintercollege.onrender.com` पर चलेगा।

## 📝 Testing

### 1. Health Check:
```bash
curl https://jrcintercollege.onrender.com/api/health
```

### 2. Admission Form Submit करें:
- `admissions.html` page खोलें
- Form fill करें और submit करें
- Data MongoDB में save होगा

### 3. Admin Portal:
- `admin.html` page खोलें
- सभी submissions देखें
- Status update करें

## 🔧 Troubleshooting

### MongoDB Connection Error:
```bash
# Check if MongoDB is running
pgrep mongod

# Start MongoDB
mongod --dbpath ~/data/db
```

### Port Already in Use:
```bash
# Change PORT in .env file
PORT=3001
```

### CORS Error:
- `.env` में `FRONTEND_URL` सही set करें
- Frontend server का URL match करना चाहिए

## 📊 Database Structure

### Admission Collection:
- `studentName` (String, Required)
- `classApplying` (String, Required)
- `parentMobile` (String, Required, 10 digits)
- `message` (String, Optional)
- `status` (String: pending/contacted/admitted/rejected)
- `notes` (String, Optional)
- `submittedAt` (Date)
- `contactedAt` (Date)

## 🔐 Security Notes

⚠️ **Production में:**
- Admin routes में authentication add करें
- MongoDB में username/password set करें
- HTTPS use करें
- Rate limiting add करें

## 📞 API Endpoints

- `POST /api/admissions/submit` - Admission form submit
- `GET /api/admissions` - Get all admissions (admin)
- `GET /api/admissions/:id` - Get single admission
- `PATCH /api/admissions/:id/status` - Update status
