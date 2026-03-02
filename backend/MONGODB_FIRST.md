# ❌ MongoDB connection error? Start MongoDB first

Error: `connect ECONNREFUSED 127.0.0.1:27017` means **MongoDB is not running**.

## Step 1: Start MongoDB

**Option A – Script (recommended)**  
In a **new Terminal** (keep it open):

```bash
cd "/Users/shivmanisingh/school project/backend"
./start-mongodb.sh
```

**Option B – Manual**  
If the script fails, run:

```bash
mkdir -p ~/data/db
mongod --dbpath ~/data/db
```

Leave this Terminal open (MongoDB runs here).

**Option C – Homebrew (Mac)**  
If you installed MongoDB with Homebrew:

```bash
brew services start mongodb-community
# or
brew services start mongodb
```

## Step 2: Start backend again

In your **original Terminal** (where you ran `npm run dev`):

1. Stop the server: **Ctrl+C**
2. Start again:

```bash
npm run dev
```

You should see:

```
✅ Connected to MongoDB
🚀 Server running on port 3000
```

## Step 3: Use the site

- Open the site and submit the admission form, or  
- Open the Admin panel.

---

**Summary:** Use **two Terminals**: one for MongoDB, one for `npm run dev`.  
Or run `./start-server.sh` from the backend folder; it starts MongoDB and then the server.
