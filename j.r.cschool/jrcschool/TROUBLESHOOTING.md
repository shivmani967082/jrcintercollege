# 🔧 Troubleshooting Guide

## Form Submit करने पर "Backend से Connect नहीं हो रहा" Error

### ✅ Solution 1: Backend Server Start करें

**Terminal में ये commands run करें:**

```bash
# Step 1: MongoDB start करें
cd backend
./start-mongodb.sh

# Step 2: Backend server start करें
npm run dev
```

या एक साथ:
```bash
cd backend
./start-server.sh
```

### ✅ Solution 2: Check करें कि Server Running है

**नया terminal खोलें और run करें:**
```bash
cd backend
node check-server.js
```

अगर ✅ दिखे तो server running है, अगर ❌ दिखे तो server start करें।

### ✅ Solution 3: Port Check करें

**Check करें कि port 3000 available है:**
```bash
lsof -i :3000
```

अगर कोई process दिखे तो:
- उसे stop करें: `kill -9 <PID>`
- या `.env` में PORT change करें: `PORT=3001`

### ✅ Solution 4: CORS Issue Fix

अगर browser console में CORS error दिखे:

1. **Backend server restart करें**
2. **Browser cache clear करें** (Ctrl+Shift+Delete)
3. **Hard refresh करें** (Ctrl+Shift+R)

### ✅ Solution 5: Fallback Mode

अगर backend server नहीं चला सकते:

- Form अभी भी काम करेगा
- Data localStorage में save होगा
- WhatsApp message भी जाएगा (अगर configured है)
- बाद में जब server start करेंगे, तो localStorage से data sync हो सकता है

## 🔍 Common Issues

### Issue 1: MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# MongoDB start करें
mongod --dbpath ~/data/db

# या script use करें
cd backend
./start-mongodb.sh
```

### Issue 2: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Process find करें
lsof -i :3000

# Process kill करें
kill -9 <PID>

# या PORT change करें .env में
PORT=3001
```

### Issue 3: Module Not Found
```
Error: Cannot find module 'mongoose'
```

**Solution:**
```bash
cd backend
npm install
```

### Issue 4: .env File Missing
```
Error: Cannot read property 'MONGODB_URI' of undefined
```

**Solution:**
```bash
cd backend
# .env file already exists, check if it's there
ls -la .env
```

## 📞 Quick Test Commands

### Test Backend Health:
```bash
curl https://jrcintercollege.onrender.com/api/health
```

### Test MongoDB:
```bash
mongosh mongodb://localhost:27017/jrc-school
```

### Test Form Submission (from terminal):
```bash
curl -X POST https://jrcintercollege.onrender.com/api/admissions/submit \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Test Student",
    "classApplying": "1st",
    "parentMobile": "9876543210",
    "message": "Test message"
  }'
```

## 🎯 Step-by-Step Fix

1. **Terminal 1 में MongoDB start करें:**
   ```bash
   cd backend
   ./start-mongodb.sh
   ```

2. **Terminal 2 में Backend start करें:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Browser में form test करें:**
   - `admissions.html` खोलें
   - Form fill करें
   - Submit करें
   - Browser console check करें (F12)

4. **Admin portal check करें:**
   - `admin.html` खोलें
   - Data दिखना चाहिए

## 💡 Tips

- **Always check browser console** (F12) for errors
- **Check terminal** where server is running for errors
- **MongoDB must be running** before starting backend
- **Use `npm run dev`** for development (auto-reload)
- **Check `.env` file** exists and has correct values
