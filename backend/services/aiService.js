/**
 * AI Service
 * Handles AI assistant responses
 * Can use rule-based system or integrate with OpenAI API
 */

// Rule-based response system (enhanced version of frontend logic)
function getRuleBasedResponse(question, chatHistory = []) {
  const q = question.toLowerCase();

  // Admissions
  if (q.includes('admission') || q.includes('admissions') || q.includes('प्रवेश') || q.includes('apply')) {
    return 'Admissions are open from Nursery to Class 12, based on seat availability. The process includes:\n\n1. Collecting the admission form from the school office\n2. Filling in all details and attaching required documents\n3. Submitting the form within given dates\n4. Attending interaction/entrance test (if applicable)\n5. Completing fee payment on selection\n\nYou can also submit an online enquiry form on the Admissions page. Would you like more details about any step?';
  }

  // Fees
  if (q.includes('fee') || q.includes('fees') || q.includes('फीस') || q.includes('cost') || q.includes('price')) {
    const classMatch = q.match(/(class|grade|standard)\s*(\d+)|(\d+)\s*(st|nd|rd|th|class)/i);
    if (classMatch || q.includes('lkg') || q.includes('ukg') || q.includes('nursery')) {
      let classNum = classMatch ? parseInt(classMatch[2] || classMatch[3]) : 0; // 0 for LKG/UKG
      let tuitionFee = '';
      let newFee = '';
      let oldFee = '';

      if (q.includes('lkg') || q.includes('ukg') || q.includes('nursery')) { tuitionFee = '₹350'; newFee = '₹500'; oldFee = '₹300'; classNum = 'L.K.G. / U.K.G.'; }
      else if (classNum >= 1 && classNum <= 5) { tuitionFee = '₹400'; newFee = '₹500'; oldFee = '₹300'; }
      else if (classNum >= 6 && classNum <= 8) { tuitionFee = '₹450'; newFee = '₹500'; oldFee = '₹300'; }
      else if (classNum === 9) { tuitionFee = '₹500'; newFee = '₹800'; oldFee = '₹800'; }
      else if (classNum === 10) { tuitionFee = '₹500'; newFee = '₹1300'; oldFee = '₹1300'; }
      else if (classNum === 11) { tuitionFee = '₹550'; newFee = '₹800'; oldFee = '₹800'; }
      else if (classNum === 12) { tuitionFee = '₹550'; newFee = '₹1300'; oldFee = '₹1300'; }
      else { return 'Our fee chart covers L.K.G to Class 12th. Please specify a valid class to know the fee details.'; }

      return `For Class ${classNum}, the latest fee structure is:\n- Tuition Fee (Monthly): ${tuitionFee}\n- Admission Fee (New Student): ${newFee}\n- Re-admission Fee (Old Student): ${oldFee}\n\n* Exam Fee: ₹600 per year is mandatory for all students.\nTransport fees are additional (₹350 - ₹600/month based on distance).\n\nYou can use the Fee Calculator on the Fee Structure page for a full annual estimate. Would you like to know transport details?`;
    }
    return 'Our official fee structure for 2025 is as follows:\n\n• L.K.G. / U.K.G.: ₹350/mo\n• Class 1-5: ₹400/mo\n• Class 6-8: ₹450/mo\n• Class 9-10: ₹500/mo\n• Class 11-12: ₹550/mo\n\n* Mandatory exam fee of ₹600/year applies to all. Admission fees are extra.\nTransport fees are ₹350 to ₹600/month depending on distance. Please check the Fee Structure page and use the AI Fee Advisor calculator for an exact estimate.';
  }

  // Timings
  if (q.includes('timing') || q.includes('time') || q.includes('समय') || q.includes('hours') || q.includes('schedule')) {
    return 'Regular school timings are typically from **8:00 AM to 2:00 PM** (Monday to Saturday).\n\nExact timings may vary by:\n• Season (summer/winter)\n• Class level\n• Special events or activities\n\nPlease contact the school office at +91 8874543973 for the latest schedule. Would you like the contact details?';
  }

  // Contact
  if (q.includes('contact') || q.includes('phone') || q.includes('mobile') || q.includes('number') || q.includes('address') || q.includes('location')) {
    return 'You can contact J.R.C. Inter College:\n\n📞 **Phone:** +91 8874543973\n📧 **Email:** info@jrcschool.com\n📍 **Address:** Harahi Bazar, Basti, Uttar Pradesh\n\nOffice hours: Monday to Saturday, 9:00 AM to 4:00 PM\n\nWould you like directions or more contact information?';
  }

  // About school
  if (q.includes('about') || q.includes('school') || q.includes('jrc') || q.includes('information')) {
    return 'J.R.C. Inter College, Harahi Bazar Basti, is focused on holistic development with:\n\n✨ **Facilities:**\n• Smart classrooms with digital learning\n• Modern computer labs\n• Well-equipped library\n• Sports facilities\n• Safe and secure campus\n\n👨‍🏫 **Faculty:** Experienced and qualified teachers\n\n🏆 **Achievements:** Excellence in sports, especially Kho-Kho (district and state level)\n\nVisit the About page for vision, mission, and principal\'s message. What would you like to know more about?';
  }

  // Facilities
  if (q.includes('facility') || q.includes('facilities') || q.includes('infrastructure') || q.includes('lab') || q.includes('library')) {
    return 'Our school offers excellent facilities:\n\n🏫 **Smart Classrooms** - Interactive digital learning environment\n💻 **Computer Lab** - Latest technology for digital literacy\n📚 **Library** - Vast collection of books and resources\n⚽ **Sports & Activities** - Encouraging physical fitness and teamwork\n👨‍🏫 **Experienced Faculty** - Highly qualified teachers\n🔒 **Safe Campus** - Secure and caring environment\n\nWe also have active participation in sports like Kho-Kho, athletics, kabaddi, and cultural events. Which facility interests you most?';
  }

  // Sports
  if (q.includes('sport') || q.includes('kho') || q.includes('athletic') || q.includes('game')) {
    return 'Our school has achieved great success in sports, especially in **Kho-Kho**! 🏆\n\nOur students have won:\n• District-level trophies\n• State-level trophies\n• Recognition in local tournaments\n\nApart from Kho-Kho, students participate in:\n• Athletics\n• Kabaddi\n• Cultural events\n\nWe believe in a perfect balance of education and sportsmanship. Would you like to know about joining our sports programs?';
  }

  // Documents
  if (q.includes('document') || q.includes('required') || q.includes('paper') || q.includes('certificate')) {
    return 'For admission, you need:\n\n📄 **Required Documents:**\n• Birth certificate (for Nursery & Primary classes)\n• Previous class mark sheet/progress report\n• Transfer certificate (T.C.) from previous school\n• Aadhaar card of student and parents\n• Passport size photographs (student & parents)\n\nMake sure all documents are attested and in order. Need help with any specific document?';
  }

  // Greetings
  if (q.includes('hello') || q.includes('hi') || q.includes('namaste') || q.includes('hey')) {
    return 'Namaste! 👋 Welcome to J.R.C. Inter College. I\'m here to help you with:\n\n• Admissions information\n• Fee structure\n• School timings\n• Facilities\n• Contact details\n• And more!\n\nWhat would you like to know?';
  }

  // Thanks
  if (q.includes('thank') || q.includes('thanks')) {
    return 'You\'re welcome! 😊 If you have any more questions, feel free to ask. You can also visit our website pages or contact the school directly at +91 8874543973.';
  }

  // Default
  return 'I understand you\'re asking about: "' + question + '"\n\nI can help you with:\n• Admissions process and documents\n• Fee structure and calculator\n• School timings and schedule\n• Facilities and infrastructure\n• Contact information\n• Sports and achievements\n\nPlease rephrase your question or ask about one of these topics. You can also call the school office at +91 8874543973 for detailed information.';
}

// Get AI response (can use OpenAI API or rule-based)
async function getResponse(question, chatHistory = []) {
  // Option 1: Use OpenAI API (if configured)
  if (process.env.OPENAI_API_KEY) {
    try {
      return await getOpenAIResponse(question, chatHistory);
    } catch (error) {
      console.error('OpenAI API error, falling back to rule-based:', error);
      // Fall back to rule-based
    }
  }

  // Option 2: Use rule-based system (default)
  return getRuleBasedResponse(question, chatHistory);
}

// Get response from OpenAI API (future implementation)
async function getOpenAIResponse(question, chatHistory = []) {
  // This would integrate with OpenAI API
  // Example implementation:

  /*
  const OpenAI = require('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant for J.R.C. Inter College. Provide accurate information about admissions, fees, facilities, and school information.'
    },
    ...chatHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    {
      role: 'user',
      content: question
    }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: messages,
    temperature: 0.7,
    max_tokens: 500
  });

  return completion.choices[0].message.content;
  */

  throw new Error('OpenAI API not configured');
}

module.exports = {
  getResponse,
  getRuleBasedResponse,
  getOpenAIResponse
};
