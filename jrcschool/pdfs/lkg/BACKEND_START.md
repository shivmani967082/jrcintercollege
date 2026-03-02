# Backend Server कैसे चालू करें

**"Failed to fetch"** error तब आता है जब backend server चल नहीं रहा होता।

## ✅ ऐसे चालू करें

### Step 1: Terminal खोलें

### Step 2: ये commands चलाएं

```bash
cd "/Users/shivmanisingh/school project/backend"
npm run dev
```

### Step 3: यह दिखना चाहिए

```
✅ Connected to MongoDB
🚀 Server running on port 3000
```

### Step 4: अब वेबसाइट पर फिर से try करें

- Admission form submit करें
- या Admin panel खोलें

---

## अगर MongoDB Error आए

पहले MongoDB चालू करें:

```bash
cd "/Users/shivmanisingh/school project/backend"
./start-mongodb.sh
```

फिर दोबारा:

```bash
npm run dev
```

---

## एक साथ चालू करने के लिए

```bash
cd "/Users/shivmanisingh/school project/backend"
./start-server.sh
```

इससे MongoDB + Backend दोनों start हो जाएंगे।
