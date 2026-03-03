/**
 * AI Assistant for JRC School Website
 * Enhanced chat functionality with better responses and features
 */

const JRCAssistant = {
  chatHistory: [],
  isTyping: false,
  currentLanguage: 'hi', // Default to Hindi

  // ============================================
  // LANGUAGE DETECTION
  // ============================================
  detectLanguage(text) {
    const hindiChars = /[\u0900-\u097F]/;
    const englishWords = /\b(the|is|are|and|or|for|with|this|that|what|how|when|where|why|can|will|should|would|have|has|had|do|does|did|am|was|were|be|been|being|a|an|in|on|at|to|from|of|by|as|it|we|you|they|he|she|him|her|his|hers|our|your|their|my|me|i)\b/i;

    const hasHindi = hindiChars.test(text);
    const hasEnglish = englishWords.test(text);
    const englishWordCount = (text.match(englishWords) || []).length;
    const totalWords = text.split(/\s+/).length;
    const englishRatio = totalWords > 0 ? englishWordCount / totalWords : 0;

    // If has Hindi characters
    if (hasHindi) {
      // If also has significant English words (more than 30% English words), it's Hinglish
      if (hasEnglish && englishRatio > 0.3) {
        return 'hinglish';
      }
      // Otherwise it's Hindi
      return 'hi';
    }

    // If only English words, it's English
    if (hasEnglish || englishRatio > 0.5) {
      return 'en';
    }

    // Default to Hindi
    return 'hi';
  },

  // ============================================
  // INITIALIZATION
  // ============================================
  init() {
    const chatForm = document.getElementById('chatForm');
    const chatWindow = document.getElementById('chatWindow');

    if (!chatForm || !chatWindow) return;

    // Load chat history from localStorage
    this.loadChatHistory();

    // Form submission
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleUserMessage();
    });

    // Enter key support
    const userInput = document.getElementById('userInput');
    if (userInput) {
      userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleUserMessage();
        }
      });
    }

    // Welcome message if no history
    if (this.chatHistory.length === 0) {
      // Default welcome in Hindi, will adapt based on first user message
      this.addMessage('नमस्ते! मैं JRC AI सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?', 'ai');
    }
  },

  // ============================================
  // MESSAGE HANDLING
  // ============================================
  handleUserMessage() {
    const userInput = document.getElementById('userInput');
    if (!userInput) return;

    const text = userInput.value.trim();
    if (!text) return;

    // Detect and store language before processing
    this.currentLanguage = this.detectLanguage(text);

    // Add user message
    this.addMessage(text, 'user');
    userInput.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    // Get AI response (with delay for realistic feel)
    setTimeout(() => {
      this.hideTypingIndicator();
      const response = this.getAIResponse(text);
      this.addMessage(response, 'ai');
    }, 800 + Math.random() * 500); // Random delay between 800-1300ms
  },

  // ============================================
  // AI RESPONSE LOGIC
  // ============================================
  getAIResponse(question) {
    const q = question.toLowerCase();
    this.chatHistory.push({ role: 'user', content: question });

    // Language already detected in handleUserMessage, use currentLanguage
    // Enhanced rule-based responses
    if (q.includes('admission') || q.includes('admissions') || q.includes('प्रवेश') || q.includes('apply')) {
      return this.getResponse('admission');
    }

    if (q.includes('fee') || q.includes('fees') || q.includes('फीस') || q.includes('cost') || q.includes('price')) {
      const classMatch = q.match(/(class|grade|standard|कक्षा)\s*(\d+)|(\d+)\s*(st|nd|rd|th|class|कक्षा)/i);
      if (classMatch) {
        const classNum = parseInt(classMatch[2] || classMatch[3]);
        return this.getResponse('fee_class', { classNum });
      }
      return this.getResponse('fee');
    }

    if (q.includes('timing') || q.includes('time') || q.includes('समय') || q.includes('hours') || q.includes('schedule')) {
      return this.getResponse('timing');
    }

    if (q.includes('contact') || q.includes('phone') || q.includes('mobile') || q.includes('number') || q.includes('address') || q.includes('location')) {
      return this.getResponse('contact');
    }

    if (q.includes('about') || q.includes('school') || q.includes('jrc') || q.includes('information')) {
      return this.getResponse('about');
    }

    if (q.includes('facility') || q.includes('facilities') || q.includes('infrastructure') || q.includes('lab') || q.includes('library')) {
      return this.getResponse('facilities');
    }

    if (q.includes('sport') || q.includes('kho') || q.includes('athletic') || q.includes('game')) {
      return this.getResponse('sports');
    }

    if (q.includes('document') || q.includes('required') || q.includes('paper') || q.includes('certificate')) {
      return this.getResponse('documents');
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('namaste') || q.includes('hey')) {
      return this.getResponse('greeting');
    }

    if (q.includes('thank') || q.includes('thanks')) {
      return this.getResponse('thanks');
    }

    // Default fallback with helpful suggestions
    return this.getResponse('default', { question });
  },

  // ============================================
  // MULTILINGUAL RESPONSES
  // ============================================
  getResponse(type, params = {}) {
    const lang = this.currentLanguage;
    const responses = {
      admission: {
        hi: 'नर्सरी से कक्षा 12 तक प्रवेश सीट की उपलब्धता के आधार पर खुले हैं। प्रक्रिया में शामिल है:\n\n1. स्कूल कार्यालय से प्रवेश फॉर्म लेना\n2. सभी विवरण भरना और आवश्यक दस्तावेज़ संलग्न करना\n3. दिए गए तारीखों के भीतर फॉर्म जमा करना\n4. बातचीत/प्रवेश परीक्षा में भाग लेना (यदि लागू हो)\n5. चयन पर फीस का भुगतान पूरा करना\n\nआप प्रवेश पृष्ठ पर एक ऑनलाइन पूछताछ फॉर्म भी जमा कर सकते हैं। क्या आप किसी भी चरण के बारे में अधिक विवरण चाहेंगे?',
        hinglish: 'Admissions नर्सरी से class 12 तक seat availability के basis पर खुले हैं। Process में शामिल है:\n\n1. School office से admission form लेना\n2. सभी details भरना और required documents attach करना\n3. दिए गए dates के भीतर form submit करना\n4. Interaction/entrance test में भाग लेना (if applicable)\n5. Selection पर fee payment complete करना\n\nआप admissions page पर एक online enquiry form भी submit कर सकते हैं। क्या आप किसी भी step के बारे में more details चाहेंगे?',
        en: 'Admissions are open from Nursery to Class 12, based on seat availability. The process includes:\n\n1. Collecting the admission form from the school office\n2. Filling in all details and attaching required documents\n3. Submitting the form within given dates\n4. Attending interaction/entrance test (if applicable)\n5. Completing fee payment on selection\n\nYou can also submit an online enquiry form on the Admissions page. Would you like more details about any step?'
      },
      fee: {
        hi: 'हमारी आधिकारिक फीस संरचना 2025 इस प्रकार है:\n\n• L.K.G. / U.K.G.: ₹350/माह\n• कक्षा 1-5: ₹400/माह\n• कक्षा 6-8: ₹450/माह\n• कक्षा 9-10: ₹500/माह\n• कक्षा 11-12: ₹550/माह\n\n* परीक्षा शुल्क ₹600 वार्षिक अनिवार्य है। एडमिशन फीस अलग से है।\nपरिवहन शुल्क अतिरिक्त हैं (दूरी के अनुसार ₹350-₹600/माह)। कृपया विवरण के लिए फीस संरचना पृष्ठ देखें और अनुमान के लिए AI फीस सलाहकार का उपयोग करें।',
        hinglish: 'हमारी official fee structure 2025 इस प्रकार है:\n\n• L.K.G. / U.K.G.: ₹350/month\n• Class 1-5: ₹400/month\n• Class 6-8: ₹450/month\n• Class 9-10: ₹500/month\n• Class 11-12: ₹550/month\n\n* Exam fee ₹600/year mandatory है। Admission fee extra है।\nTransport fees additional हैं (distance के according ₹350-₹600/month)। कृपया details के लिए Fee Structure page देखें और estimate के लिए AI Fee Advisor use करें।',
        en: 'Our official fee structure for 2025 is as follows:\n\n• L.K.G. / U.K.G.: ₹350/mo\n• Class 1-5: ₹400/mo\n• Class 6-8: ₹450/mo\n• Class 9-10: ₹500/mo\n• Class 11-12: ₹550/mo\n\n* Mandatory exam fee of ₹600/year applies to all. Admission fees are extra.\nTransport fees are additional (₹350-₹600/month depending on distance). Please check the Fee Structure page and use the AI Fee Advisor calculator for an exact estimate.'
      },
      fee_class: {
        hi: (p) => {
          let tuitionFee = ''; let newFee = ''; let oldFee = '';
          if (p.classNum === 0 || p.classNum === undefined) { tuitionFee = '₹350'; newFee = '₹500'; oldFee = '₹300'; }
          else if (p.classNum <= 5) { tuitionFee = '₹400'; newFee = '₹500'; oldFee = '₹300'; }
          else if (p.classNum <= 8) { tuitionFee = '₹450'; newFee = '₹500'; oldFee = '₹300'; }
          else if (p.classNum <= 10) { tuitionFee = '₹500'; newFee = '₹1300'; oldFee = '₹1300'; }
          else { tuitionFee = '₹550'; newFee = '₹1300'; oldFee = '₹1300'; }
          return `कक्षा ${p.classNum || 'L.K.G/U.K.G'} के लिए, नवीनतम फीस संरचना है:\n- ट्यूशन फीस (मासिक): ${tuitionFee}\n- प्रवेश शुल्क (नया छात्र): ${newFee}\n- पुनः प्रवेश शुल्क (पुराना छात्र): ${oldFee}\n\n* परीक्षा शुल्क ₹600 प्रति वर्ष अनिवार्य है। परिवहन शुल्क अतिरिक्त हैं (₹350 - ₹600/माह)।\n\nसटीक वार्षिक गणना के लिए आप फीस संरचना पृष्ठ पर फीस कैलकुलेटर का उपयोग कर सकते हैं। क्या आप परिवहन विवरण जानना चाहेंगे?`;
        },
        hinglish: (p) => {
          let tuitionFee = ''; let newFee = ''; let oldFee = '';
          if (p.classNum === 0 || p.classNum === undefined) { tuitionFee = '₹350'; newFee = '₹500'; oldFee = '₹300'; }
          else if (p.classNum <= 5) { tuitionFee = '₹400'; newFee = '₹500'; oldFee = '₹300'; }
          else if (p.classNum <= 8) { tuitionFee = '₹450'; newFee = '₹500'; oldFee = '₹300'; }
          else if (p.classNum <= 10) { tuitionFee = '₹500'; newFee = '₹1300'; oldFee = '₹1300'; }
          else { tuitionFee = '₹550'; newFee = '₹1300'; oldFee = '₹1300'; }
          return `Class ${p.classNum || 'L.K.G/U.K.G'} के लिए, latest fee structure है:\n- Tuition Fee (Monthly): ${tuitionFee}\n- Admission Fee (New Student): ${newFee}\n- Re-admission Fee (Old Student): ${oldFee}\n\n* Exam Fee ₹600 per year mandatory है। Transport fees additional हैं (₹350 - ₹600/month)।\n\nआप exact annual estimate के लिए Fee Structure page पर fee calculator use कर सकते हैं। क्या आप transport details जानना चाहेंगे?`;
        },
        en: (p) => {
          let tuitionFee = ''; let newFee = ''; let oldFee = '';
          if (p.classNum === 0 || p.classNum === undefined) { tuitionFee = '₹350'; newFee = '₹500'; oldFee = '₹300'; }
          else if (p.classNum <= 5) { tuitionFee = '₹400'; newFee = '₹500'; oldFee = '₹300'; }
          else if (p.classNum <= 8) { tuitionFee = '₹450'; newFee = '₹500'; oldFee = '₹300'; }
          else if (p.classNum <= 10) { tuitionFee = '₹500'; newFee = '₹1300'; oldFee = '₹1300'; }
          else { tuitionFee = '₹550'; newFee = '₹1300'; oldFee = '₹1300'; }
          return `For Class ${p.classNum || 'L.K.G/U.K.G'}, the latest fee structure is:\n- Tuition Fee (Monthly): ${tuitionFee}\n- Admission Fee (New Student): ${newFee}\n- Re-admission Fee (Old Student): ${oldFee}\n\n* Exam Fee: ₹600 per year is mandatory. Transport fees are additional (₹350 - ₹600/month based on distance).\n\nYou can use the Fee Calculator on the Fee Structure page for a full annual estimate. Would you like to know transport details?`;
        }
      },
      timing: {
        hi: 'नियमित स्कूल का समय आमतौर पर **सुबह 8:00 बजे से दोपहर 2:00 बजे तक** (सोमवार से शनिवार) होता है।\n\nसटीक समय निम्नलिखित के अनुसार भिन्न हो सकता है:\n• मौसम (गर्मी/सर्दी)\n• कक्षा स्तर\n• विशेष कार्यक्रम या गतिविधियां\n\nनवीनतम समयसारणी के लिए कृपया स्कूल कार्यालय से +91 8874543973 पर संपर्क करें। क्या आप संपर्क विवरण चाहेंगे?',
        hinglish: 'Regular school timings आमतौर पर **सुबह 8:00 AM से दोपहर 2:00 PM तक** (Monday से Saturday) होते हैं।\n\nExact timings निम्नलिखित के according vary हो सकते हैं:\n• Season (summer/winter)\n• Class level\n• Special events या activities\n\nLatest schedule के लिए कृपया school office से +91 8874543973 पर contact करें। क्या आप contact details चाहेंगे?',
        en: 'Regular school timings are typically from **8:00 AM to 2:00 PM** (Monday to Saturday).\n\nExact timings may vary by:\n• Season (summer/winter)\n• Class level\n• Special events or activities\n\nPlease contact the school office at +91 8874543973 for the latest schedule. Would you like the contact details?'
      },
      contact: {
        hi: 'आप J.R.C. इंटर कॉलेज से संपर्क कर सकते हैं:\n\n📞 **फोन:** +91 8874543973\n📧 **ईमेल:** info@jrcschool.com\n📍 **पता:** हरही बाज़ार, बस्ती, उत्तर प्रदेश\n\nकार्यालय समय: सोमवार से शनिवार, सुबह 9:00 बजे से शाम 4:00 बजे तक\n\nक्या आप दिशा-निर्देश या अधिक संपर्क जानकारी चाहेंगे?',
        hinglish: 'आप J.R.C. Inter College से contact कर सकते हैं:\n\n📞 **Phone:** +91 8874543973\n📧 **Email:** info@jrcschool.com\n📍 **Address:** Harahi Bazar, Basti, Uttar Pradesh\n\nOffice hours: Monday से Saturday, सुबह 9:00 AM से शाम 4:00 PM तक\n\nक्या आप directions या more contact information चाहेंगे?',
        en: 'You can contact J.R.C. Inter College:\n\n📞 **Phone:** +91 8874543973\n📧 **Email:** info@jrcschool.com\n📍 **Address:** Harahi Bazar, Basti, Uttar Pradesh\n\nOffice hours: Monday to Saturday, 9:00 AM to 4:00 PM\n\nWould you like directions or more contact information?'
      },
      about: {
        hi: 'J.R.C. इंटर कॉलेज, हरही बाज़ार बस्ती, निम्नलिखित के साथ सर्वांगीण विकास पर केंद्रित है:\n\n✨ **सुविधाएं:**\n• डिजिटल शिक्षा के साथ स्मार्ट कक्षाएं\n• आधुनिक कंप्यूटर लैब\n• अच्छी तरह से सुसज्जित पुस्तकालय\n• खेल सुविधाएं\n• सुरक्षित और सुरक्षित परिसर\n\n👨‍🏫 **शिक्षक:** अनुभवी और योग्य शिक्षक\n\n🏆 **उपलब्धियां:** खेलों में उत्कृष्टता, विशेष रूप से खो-खो (जिला और राज्य स्तर)\n\nदृष्टि, मिशन और प्रधानाचार्य के संदेश के लिए हमारे बारे में पृष्ठ पर जाएं। आप और क्या जानना चाहेंगे?',
        hinglish: 'J.R.C. Inter College, Harahi Bazar Basti, निम्नलिखित के साथ holistic development पर focused है:\n\n✨ **Facilities:**\n• Smart classrooms digital learning के साथ\n• Modern computer labs\n• Well-equipped library\n• Sports facilities\n• Safe और secure campus\n\n👨‍🏫 **Faculty:** Experienced और qualified teachers\n\n🏆 **Achievements:** Sports में excellence, especially Kho-Kho (district और state level)\n\nVision, mission और principal\'s message के लिए About page पर जाएं। आप और क्या जानना चाहेंगे?',
        en: 'J.R.C. Inter College, Harahi Bazar Basti, is focused on holistic development with:\n\n✨ **Facilities:**\n• Smart classrooms with digital learning\n• Modern computer labs\n• Well-equipped library\n• Sports facilities\n• Safe and secure campus\n\n👨‍🏫 **Faculty:** Experienced and qualified teachers\n\n🏆 **Achievements:** Excellence in sports, especially Kho-Kho (district and state level)\n\nVisit the About page for vision, mission, and principal\'s message. What would you like to know more about?'
      },
      facilities: {
        hi: 'हमारा स्कूल उत्कृष्ट सुविधाएं प्रदान करता है:\n\n🏫 **स्मार्ट कक्षाएं** - इंटरैक्टिव डिजिटल शिक्षण वातावरण\n💻 **कंप्यूटर लैब** - डिजिटल साक्षरता के लिए नवीनतम तकनीक\n📚 **पुस्तकालय** - पुस्तकों और संसाधनों का विशाल संग्रह\n⚽ **खेल और गतिविधियां** - शारीरिक फिटनेस और टीम वर्क को प्रोत्साहित करना\n👨‍🏫 **अनुभवी शिक्षक** - अत्यधिक योग्य शिक्षक\n🔒 **सुरक्षित परिसर** - सुरक्षित और देखभाल करने वाला वातावरण\n\nहम खो-खो, एथलेटिक्स, कबड्डी और सांस्कृतिक कार्यक्रमों जैसे खेलों में सक्रिय भागीदारी भी रखते हैं। आपको कौन सी सुविधा सबसे अधिक रुचिकर लगती है?',
        hinglish: 'हमारा school excellent facilities provide करता है:\n\n🏫 **Smart Classrooms** - Interactive digital learning environment\n💻 **Computer Lab** - Latest technology digital literacy के लिए\n📚 **Library** - Books और resources का vast collection\n⚽ **Sports & Activities** - Physical fitness और teamwork को encourage करना\n👨‍🏫 **Experienced Faculty** - Highly qualified teachers\n🔒 **Safe Campus** - Secure और caring environment\n\nहम Kho-Kho, athletics, kabaddi और cultural events जैसे sports में active participation भी रखते हैं। आपको कौन सी facility सबसे ज्यादा interesting लगती है?',
        en: 'Our school offers excellent facilities:\n\n🏫 **Smart Classrooms** - Interactive digital learning environment\n💻 **Computer Lab** - Latest technology for digital literacy\n📚 **Library** - Vast collection of books and resources\n⚽ **Sports & Activities** - Encouraging physical fitness and teamwork\n👨‍🏫 **Experienced Faculty** - Highly qualified teachers\n🔒 **Safe Campus** - Secure and caring environment\n\nWe also have active participation in sports like Kho-Kho, athletics, kabaddi, and cultural events. Which facility interests you most?'
      },
      sports: {
        hi: 'हमारे स्कूल ने खेलों में, विशेष रूप से **खो-खो** में बहुत बड़ी सफलता हासिल की है! 🏆\n\nहमारे छात्रों ने जीता है:\n• जिला-स्तरीय ट्रॉफ़ियाँ\n• राज्य-स्तरीय ट्रॉफ़ियाँ\n• स्थानीय टूर्नामेंट में मान्यता\n\nखो-खो के अलावा, छात्र इनमें भाग लेते हैं:\n• एथलेटिक्स\n• कबड्डी\n• सांस्कृतिक कार्यक्रम\n\nहम शिक्षा और खेल भावना के सही संतुलन में विश्वास करते हैं। क्या आप हमारे खेल कार्यक्रमों में शामिल होने के बारे में जानना चाहेंगे?',
        hinglish: 'हमारे school ने sports में, especially **Kho-Kho** में बहुत बड़ी success हासिल की है! 🏆\n\nहमारे students ने जीता है:\n• District-level trophies\n• State-level trophies\n• Local tournaments में recognition\n\nKho-Kho के अलावा, students इनमें participate करते हैं:\n• Athletics\n• Kabaddi\n• Cultural events\n\nहम education और sportsmanship के perfect balance में believe करते हैं। क्या आप हमारे sports programs में join होने के बारे में जानना चाहेंगे?',
        en: 'Our school has achieved great success in sports, especially in **Kho-Kho**! 🏆\n\nOur students have won:\n• District-level trophies\n• State-level trophies\n• Recognition in local tournaments\n\nApart from Kho-Kho, students participate in:\n• Athletics\n• Kabaddi\n• Cultural events\n\nWe believe in a perfect balance of education and sportsmanship. Would you like to know about joining our sports programs?'
      },
      documents: {
        hi: 'प्रवेश के लिए, आपको चाहिए:\n\n📄 **आवश्यक दस्तावेज़:**\n• जन्म प्रमाणपत्र (नर्सरी और प्राथमिक कक्षाओं के लिए)\n• पिछली कक्षा की अंक पत्रिका/प्रगति रिपोर्ट\n• पिछले स्कूल से स्थानांतरण प्रमाणपत्र (T.C.)\n• छात्र और माता-पिता का आधार कार्ड\n• पासपोर्ट आकार की तस्वीरें (छात्र और माता-पिता)\n\nसुनिश्चित करें कि सभी दस्तावेज़ प्रमाणित और क्रम में हैं। किसी विशिष्ट दस्तावेज़ के साथ मदद चाहिए?',
        hinglish: 'Admission के लिए, आपको चाहिए:\n\n📄 **Required Documents:**\n• Birth certificate (Nursery और Primary classes के लिए)\n• Previous class mark sheet/progress report\n• Transfer certificate (T.C.) previous school से\n• Student और parents का Aadhaar card\n• Passport size photographs (student और parents)\n\nसुनिश्चित करें कि सभी documents attested और order में हैं। किसी specific document के साथ help चाहिए?',
        en: 'For admission, you need:\n\n📄 **Required Documents:**\n• Birth certificate (for Nursery & Primary classes)\n• Previous class mark sheet/progress report\n• Transfer certificate (T.C.) from previous school\n• Aadhaar card of student and parents\n• Passport size photographs (student & parents)\n\nMake sure all documents are attested and in order. Need help with any specific document?'
      },
      greeting: {
        hi: 'नमस्ते! 👋 J.R.C. इंटर कॉलेज में आपका स्वागत है। मैं आपकी मदद के लिए यहाँ हूं:\n\n• प्रवेश जानकारी\n• फीस संरचना\n• स्कूल का समय\n• सुविधाएं\n• संपर्क विवरण\n• और भी बहुत कुछ!\n\nआप क्या जानना चाहेंगे?',
        hinglish: 'Namaste! 👋 J.R.C. Inter College में आपका welcome है। मैं आपकी help के लिए यहाँ हूं:\n\n• Admission information\n• Fee structure\n• School timings\n• Facilities\n• Contact details\n• और भी बहुत कुछ!\n\nआप क्या जानना चाहेंगे?',
        en: 'Namaste! 👋 Welcome to J.R.C. Inter College. I\'m here to help you with:\n\n• Admissions information\n• Fee structure\n• School timings\n• Facilities\n• Contact details\n• And more!\n\nWhat would you like to know?'
      },
      thanks: {
        hi: 'आपका स्वागत है! 😊 यदि आपके पास और प्रश्न हैं, तो बेझिझक पूछें। आप हमारी वेबसाइट पृष्ठों पर भी जा सकते हैं या सीधे स्कूल से +91 8874543973 पर संपर्क कर सकते हैं।',
        hinglish: 'आपका welcome है! 😊 अगर आपके पास और questions हैं, तो feel free to ask। आप हमारी website pages पर भी जा सकते हैं या directly school से +91 8874543973 पर contact कर सकते हैं।',
        en: 'You\'re welcome! 😊 If you have any more questions, feel free to ask. You can also visit our website pages or contact the school directly at +91 8874543973.'
      },
      default: {
        hi: (p) => `मैं समझता हूं कि आप पूछ रहे हैं: "${p.question}"\n\nमैं आपकी इन विषयों में मदद कर सकता हूं:\n• प्रवेश प्रक्रिया और दस्तावेज़\n• फीस संरचना और कैलकुलेटर\n• स्कूल का समय और समयसारणी\n• सुविधाएं और बुनियादी ढांचा\n• संपर्क जानकारी\n• खेल और उपलब्धियां\n\nकृपया अपना प्रश्न फिर से लिखें या इनमें से किसी विषय के बारे में पूछें। आप विस्तृत जानकारी के लिए स्कूल कार्यालय को +91 8874543973 पर भी कॉल कर सकते हैं।`,
        hinglish: (p) => `मैं समझता हूं कि आप पूछ रहे हैं: "${p.question}"\n\nमैं आपकी इन topics में help कर सकता हूं:\n• Admission process और documents\n• Fee structure और calculator\n• School timings और schedule\n• Facilities और infrastructure\n• Contact information\n• Sports और achievements\n\nकृपया अपना question फिर से लिखें या इनमें से किसी topic के बारे में पूछें। आप detailed information के लिए school office को +91 8874543973 पर call कर सकते हैं।`,
        en: (p) => `I understand you're asking about: "${p.question}"\n\nI can help you with:\n• Admissions process and documents\n• Fee structure and calculator\n• School timings and schedule\n• Facilities and infrastructure\n• Contact information\n• Sports and achievements\n\nPlease rephrase your question or ask about one of these topics. You can also call the school office at +91 8874543973 for detailed information.`
      }
    };

    const response = responses[type];
    if (!response) return '';

    if (typeof response[lang] === 'function') {
      return response[lang](params);
    }
    return response[lang] || response['hi'];
  },

  // ============================================
  // MESSAGE DISPLAY
  // ============================================
  addMessage(text, sender = 'user') {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;

    // Detect language for user messages, use currentLanguage for AI messages
    let messageLang = this.currentLanguage;
    if (sender === 'user') {
      messageLang = this.detectLanguage(text);
    }

    // Save to history
    this.chatHistory.push({ role: sender, content: text });
    this.saveChatHistory();

    // Create message wrapper
    const wrapper = document.createElement('div');
    wrapper.className = `flex items-start space-x-2 chat-message ${sender === 'user' ? 'justify-end text-right user' : 'ai'}`;

    // Create bubble
    const bubble = document.createElement('div');
    bubble.className = `rounded-2xl px-4 py-3 max-w-xs text-sm ${sender === 'user'
        ? 'bg-yellow-300 text-blue-900 order-2'
        : 'bg-white bg-opacity-10 text-white'
      }`;

    // Format text with line breaks
    bubble.innerHTML = text.split('\n').map(line => {
      // Bold formatting
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return line;
    }).join('<br>');

    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = `rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold ${sender === 'user'
        ? 'bg-blue-200 text-blue-900 order-1'
        : 'bg-yellow-400 text-blue-900'
      }`;
    // Set avatar text based on detected language
    if (sender === 'user') {
      if (messageLang === 'en') {
        avatar.textContent = 'You';
      } else if (messageLang === 'hinglish') {
        avatar.textContent = 'You';
      } else {
        avatar.textContent = 'आप';
      }
    } else {
      avatar.textContent = 'AI';
    }

    // Append elements
    if (sender === 'user') {
      wrapper.appendChild(bubble);
      wrapper.appendChild(avatar);
    } else {
      wrapper.appendChild(avatar);
      wrapper.appendChild(bubble);
    }

    chatWindow.appendChild(wrapper);

    // Scroll to bottom
    setTimeout(() => {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 100);
  },

  // ============================================
  // TYPING INDICATOR
  // ============================================
  showTypingIndicator() {
    if (this.isTyping) return;
    this.isTyping = true;

    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;

    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'flex items-start space-x-2 chat-message ai';

    const avatar = document.createElement('div');
    avatar.className = 'bg-yellow-400 text-blue-900 rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold';
    avatar.textContent = 'AI';

    const bubble = document.createElement('div');
    bubble.className = 'bg-white bg-opacity-10 text-white rounded-2xl px-4 py-3';
    bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    indicator.appendChild(avatar);
    indicator.appendChild(bubble);
    chatWindow.appendChild(indicator);

    setTimeout(() => {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 100);
  },

  hideTypingIndicator() {
    this.isTyping = false;
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  },

  // ============================================
  // CHAT HISTORY MANAGEMENT
  // ============================================
  saveChatHistory() {
    // Keep only last 50 messages
    if (this.chatHistory.length > 50) {
      this.chatHistory = this.chatHistory.slice(-50);
    }
    JRCUtils.saveToLocalStorage('jrcChatHistory', this.chatHistory);
  },

  loadChatHistory() {
    const saved = JRCUtils.getFromLocalStorage('jrcChatHistory');
    if (saved && Array.isArray(saved)) {
      this.chatHistory = saved;
      // Restore messages to chat window
      const chatWindow = document.getElementById('chatWindow');
      if (chatWindow) {
        chatWindow.innerHTML = ''; // Clear welcome message
        saved.forEach(msg => {
          if (msg.role && msg.content) {
            this.addMessage(msg.content, msg.role);
          }
        });
      }
    }
  },

  clearChatHistory() {
    this.chatHistory = [];
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
      chatWindow.innerHTML = '';
    }
    localStorage.removeItem('jrcChatHistory');
    this.currentLanguage = 'hi'; // Reset to default
    this.addMessage('नमस्ते! मैं JRC AI सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?', 'ai');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => JRCAssistant.init());
} else {
  JRCAssistant.init();
}

// Export
window.JRCAssistant = JRCAssistant;
