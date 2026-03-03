# JRC School Website - JavaScript Documentation

## Overview
This directory contains all JavaScript files for the JRC School website. The code is organized into modular files for better maintainability.

## File Structure

### 1. `main.js` - Core Utilities
**Purpose:** Handles common functionality across all pages

**Features:**
- Scroll-triggered animations (Intersection Observer)
- Smooth scrolling for anchor links
- Mobile menu toggle
- Back to top button
- Navbar scroll effects
- Form validation helpers
- Tooltip system
- Lazy loading for images
- Notification system
- Loading state management
- WhatsApp/Email integration helpers
- LocalStorage utilities
- Debounce function

**Usage:** Automatically initializes on page load. Available globally as `JRCUtils`.

**Example:**
```javascript
// Show notification
JRCUtils.showNotification('Success!', 'success', 3000);

// Validate form
if (JRCUtils.validateForm(form)) {
  // Form is valid
}

// Set loading state
JRCUtils.setLoading(button, true);
```

---

### 2. `form-handler.js` - Form Management
**Purpose:** Handles all form submissions and validations

**Features:**
- Admission enquiry form handler
- Fee calculator
- Contact form handler
- WhatsApp integration for form submissions
- Email integration
- LocalStorage backup for form data

**Usage:** Automatically initializes on pages with forms. Available globally as `JRCFormHandler`.

**Forms Handled:**
- `#admissionEnquiryForm` - Admission enquiry form
- `#feeCalculator` - Fee calculation form
- `#contactForm` - Contact form (if exists)

**Example:**
```javascript
// Form automatically submits to WhatsApp
// Can be customized in form-handler.js
```

---

### 3. `ai-assistant.js` - AI Chat Assistant
**Purpose:** Enhanced chat functionality for the AI Assistant page

**Features:**
- Rule-based intelligent responses
- Chat history persistence (LocalStorage)
- Typing indicator
- Message animations
- Enhanced response system with context awareness
- Support for multiple languages (English/Hindi)

**Usage:** Automatically initializes on AI Assistant page. Available globally as `JRCAssistant`.

**Response Topics:**
- Admissions
- Fees
- School timings
- Contact information
- About school
- Facilities
- Sports achievements
- Documents required
- Greetings

**Example:**
```javascript
// Clear chat history
JRCAssistant.clearChatHistory();

// Add custom message
JRCAssistant.addMessage('Hello!', 'user');
```

---

## Integration

### HTML Pages Include:

**Home Page (`/j.r.cschool/index.html`):**
```html
<script src="js/main.js"></script>
```

**About Page (`about.html`):**
```html
<script src="js/main.js"></script>
```

**Admissions Page (`admissions.html`):**
```html
<script src="js/main.js"></script>
<script src="js/form-handler.js"></script>
```

**Fees Page (`fees.html`):**
```html
<script src="js/main.js"></script>
<script src="js/form-handler.js"></script>
```

**AI Assistant Page (`ai-assistant.html`):**
```html
<script src="js/main.js"></script>
<script src="js/ai-assistant.js"></script>
```

---

## Key Features

### 1. Scroll Animations
- Elements with `.fade-in` class animate when scrolled into view
- Uses Intersection Observer API for performance
- Staggered animations for cards

### 2. Form Validation
- Real-time validation on blur
- Pattern matching for phone/email
- Visual error indicators
- Success notifications

### 3. Mobile Responsiveness
- Mobile menu toggle
- Responsive navigation
- Touch-friendly interactions

### 4. User Experience
- Loading states
- Success/error notifications
- Smooth transitions
- Back to top button

### 5. Data Persistence
- Chat history saved to LocalStorage
- Form submissions backed up locally
- Settings persistence

---

## Customization

### Change School Contact Info
Edit `form-handler.js`:
```javascript
schoolPhone: '918874543973',
schoolEmail: 'info@jrcschool.com',
schoolName: 'J.R.C. Inter College',
```

### Add New AI Responses
Edit `ai-assistant.js` in the `getAIResponse()` function:
```javascript
if (q.includes('your-keyword')) {
  return 'Your response here';
}
```

### Modify Fee Structure
Edit `form-handler.js` in `initFeeCalculator()`:
```javascript
const baseFees = {
  nursery: 15000,
  primary: 17000,
  // ... update values
};
```

---

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used
- Intersection Observer API (polyfill available if needed)
- LocalStorage support

---

## Future Enhancements
- [ ] Connect AI Assistant to real AI API (OpenAI, etc.)
- [ ] Backend integration for form submissions
- [ ] Analytics tracking
- [ ] Progressive Web App (PWA) support
- [ ] Offline functionality
- [ ] Multi-language support expansion

---

## Notes
- All scripts are loaded at the end of `<body>` for better performance
- Scripts are modular and can be used independently
- No external dependencies required (vanilla JavaScript)
- Compatible with Tailwind CSS classes used in HTML
