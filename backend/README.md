# JRC School Backend API

Backend server for JRC School website built with Node.js and Express.

## Features

- ✅ RESTful API endpoints
- ✅ MongoDB database integration
- ✅ Form submission handling (Admissions, Contact)
- ✅ AI Assistant chat with history
- ✅ Email notifications
- ✅ WhatsApp integration
- ✅ Fee calculator API
- ✅ Input validation
- ✅ Error handling
- ✅ CORS support
- ✅ Security headers (Helmet)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/jrc-school
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   SCHOOL_PHONE=+918874543973
   SCHOOL_EMAIL=info@jrcschool.com
   FRONTEND_URL=localhost:5500
   ```

4. **Start MongoDB:**
   - Local: Make sure MongoDB is running
   - Atlas: Use your connection string in `.env`

5. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Admissions
- `POST /api/admissions/submit` - Submit admission enquiry
- `GET /api/admissions` - Get all enquiries (admin)
- `GET /api/admissions/:id` - Get single enquiry
- `PATCH /api/admissions/:id/status` - Update enquiry status

### Contact
- `POST /api/contact/submit` - Submit contact form
- `GET /api/contact` - Get all contacts (admin)

### AI Assistant
- `POST /api/ai/chat` - Send message to AI
- `GET /api/ai/history/:sessionId` - Get chat history
- `DELETE /api/ai/history/:sessionId` - Clear chat history

### Fees
- `GET /api/fees/structure` - Get fee structure
- `POST /api/fees/calculate` - Calculate fee

## API Usage Examples

### Submit Admission Enquiry
```javascript
POST /api/admissions/submit
Content-Type: application/json

{
  "studentName": "John Doe",
  "classApplying": "5th",
  "parentMobile": "9876543210",
  "message": "Interested in admission"
}
```

### Chat with AI Assistant
```javascript
POST /api/ai/chat
Content-Type: application/json

{
  "message": "What are the fees for class 8?",
  "sessionId": "session_1234567890"
}
```

### Calculate Fee
```javascript
POST /api/fees/calculate
Content-Type: application/json

{
  "class": "middle",
  "transport": "near"
}
```

## Database Models

### Admission
- studentName, classApplying, parentMobile, message
- status (pending, contacted, admitted, rejected)
- timestamps

### Contact
- name, email, phone, subject, message
- status (new, read, replied, archived)
- timestamps

### ChatHistory
- sessionId, messages[], userInfo
- timestamps

## Email Configuration

For Gmail:
1. Enable 2-factor authentication
2. Generate App Password
3. Use App Password in `EMAIL_PASS`

## WhatsApp Integration

Currently uses direct WhatsApp links. To use WhatsApp Business API:
1. Set up WhatsApp Business API account
2. Add credentials to `.env`
3. Update `services/whatsappService.js`

## OpenAI Integration (Optional)

To use real AI:
1. Get OpenAI API key
2. Add to `.env`: `OPENAI_API_KEY=your-key`
3. Install OpenAI package: `npm install openai`
4. Update `services/aiService.js`

## Frontend Integration

Update frontend JavaScript files to call these APIs:

```javascript
// Example: Submit admission form
fetch('https://jrc-school-pro.onrender.com/api/admissions/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    // Show success message
  }
});
```

## Development

- Use `npm run dev` for development (auto-reload with nodemon)
- API runs on `https://jrc-school-pro.onrender.com`
- Check console for connection status

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use MongoDB Atlas for database
3. Set up proper CORS origins
4. Use process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name jrc-school-api
   ```

## Troubleshooting

- **MongoDB connection error**: Check MongoDB is running and connection string is correct
- **Email not sending**: Verify email credentials and app password
- **CORS errors**: Update `FRONTEND_URL` in `.env`
- **Port already in use**: Change `PORT` in `.env`

## License

ISC
