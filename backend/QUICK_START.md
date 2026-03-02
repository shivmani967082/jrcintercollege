# 🚀 Quick Start Guide

## Step 1: MongoDB Start करें

```bash
cd backend
./start-mongodb.sh
```

या manually:
```bash
mongod --dbpath ~/data/db
```

## Step 2: Backend Server Start करें

```bash
cd backend
npm run dev
```

Server `https://jrc-school-pro.onrender.com` पर चलेगा।

## Step 3: Frontend खोलें

- VS Code Live Server या किसी भी static server से `pdfs/LKG` folder serve करें
- या `admissions.html` file directly browser में खोलें

## Step 4: Admin Portal खोलें

- `admin.html` file browser में खोलें
- सभी admission submissions देखें और manage करें

## ✅ Test करें

1. `admissions.html` पर जाएं
2. Form fill करें और submit करें
3. `admin.html` पर जाकर देखें कि data save हुआ है या नहीं

## 🔧 Troubleshooting

### MongoDB Connection Error:
```bash
# Check MongoDB status
pgrep mongod

# Start MongoDB
mongod --dbpath ~/data/db
```

### Backend Server Error:
- Check `.env` file exists
- Check MongoDB is running
- Check port 3000 is available

### Frontend से Backend Connect नहीं हो रहा:
- Backend server चल रहा है या नहीं check करें
- Browser console में errors check करें
- CORS settings verify करें
