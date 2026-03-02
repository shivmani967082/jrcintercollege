/**
 * WhatsApp Service
 * Handles WhatsApp message sending
 * Currently supports direct WhatsApp links
 * Can be extended to use WhatsApp Business API
 */

// Check if WhatsApp service is configured
function isConfigured() {
  // For now, we'll use direct WhatsApp links
  // In production, you can integrate WhatsApp Business API
  return !!process.env.SCHOOL_PHONE;
}

// Send WhatsApp message (opens WhatsApp with pre-filled message)
function sendMessage(phone, message) {
  if (!isConfigured()) {
    throw new Error('WhatsApp service is not configured');
  }

  // Remove + and spaces from phone number
  const cleanPhone = phone.replace(/[+\s-]/g, '');
  
  // Create WhatsApp URL
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  // In a real implementation with WhatsApp Business API, you would:
  // 1. Use the API to send the message directly
  // 2. Return the message ID
  
  // For now, we'll just log it (frontend will handle opening WhatsApp)
  console.log('📱 WhatsApp message prepared:', whatsappUrl);
  
  return {
    success: true,
    url: whatsappUrl,
    message: 'WhatsApp link generated. Frontend will open WhatsApp.'
  };
}

// Send message via WhatsApp Business API (future implementation)
async function sendViaAPI(phone, message) {
  // This would integrate with WhatsApp Business API
  // Example using Twilio or similar service:
  
  /*
  const accountSid = process.env.WHATSAPP_ACCOUNT_SID;
  const authToken = process.env.WHATSAPP_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);

  try {
    const message = await client.messages.create({
      from: `whatsapp:${process.env.WHATSAPP_PHONE_ID}`,
      to: `whatsapp:${phone}`,
      body: message
    });
    return { success: true, messageId: message.sid };
  } catch (error) {
    throw error;
  }
  */
  
  throw new Error('WhatsApp API not implemented. Use direct links instead.');
}

module.exports = {
  sendMessage,
  sendViaAPI,
  isConfigured
};
