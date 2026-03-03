/**
 * AI Assistant Routes
 * Handles AI assistant chat functionality
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ChatHistory = require('../models/ChatHistory');
const aiService = require('../services/aiService');

/**
 * POST /api/ai/chat
 * Send message to AI assistant
 */
router.post('/chat', [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters'),
  body('sessionId')
    .optional()
    .trim()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { message, sessionId } = req.body;
    const userIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Generate or use existing session ID
    let chatSession = null;
    if (sessionId) {
      chatSession = await ChatHistory.findOne({ sessionId });
    }

    if (!chatSession) {
      const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      chatSession = new ChatHistory({
        sessionId: newSessionId,
        messages: [],
        userInfo: {
          ip: userIP,
          userAgent: userAgent
        }
      });
    }

    // Add user message
    chatSession.messages.push({
      role: 'user',
      content: message
    });

    // Get AI response
    const aiResponse = await aiService.getResponse(message, chatSession.messages);

    // Add AI response
    chatSession.messages.push({
      role: 'ai',
      content: aiResponse
    });

    // Update last activity
    chatSession.lastActivity = new Date();

    // Save chat history
    await chatSession.save();

    res.json({
      success: true,
      data: {
        sessionId: chatSession.sessionId,
        response: aiResponse,
        messageCount: chatSession.messages.length
      }
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process your message. Please try again.'
    });
  }
});

/**
 * GET /api/ai/history/:sessionId
 * Get chat history for a session
 */
router.get('/history/:sessionId', async (req, res) => {
  try {
    const chatSession = await ChatHistory.findOne({ sessionId: req.params.sessionId });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: chatSession.sessionId,
        messages: chatSession.messages,
        startedAt: chatSession.startedAt,
        lastActivity: chatSession.lastActivity
      }
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history'
    });
  }
});

/**
 * DELETE /api/ai/history/:sessionId
 * Clear chat history for a session
 */
router.delete('/history/:sessionId', async (req, res) => {
  try {
    const result = await ChatHistory.deleteOne({ sessionId: req.params.sessionId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history'
    });
  }
});

module.exports = router;
