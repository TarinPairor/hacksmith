const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// VULNERABILITY #2: TTIBI-style password in error logs
// This endpoint leaks SMTP credentials in error responses
router.post('/send-email', requireAuth, (req, res) => {
  const { to, subject, body } = req.body;
  
  if (!to || !subject || !body) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['to', 'subject', 'body']
    });
  }
  
  // Simulate SMTP error with credentials in logs
  try {
    // Fake SMTP connection attempt
    const smtpConfig = {
      host: 'smtp.example.com',
      port: 587,
      user: 'noreply@example.com',
      // SECRET IN CODE - should be in env
      password: Buffer.from('smtp_password_secret_12345').toString('base64')
    };
    
    // Simulate error
    if (Math.random() > 0.5) {
      throw new Error('SMTP connection failed');
    }
    
    // If we get here, email sent successfully
    res.json({ success: true, message: 'Email sent' });
    
  } catch (error) {
    // VULNERABILITY: Error response includes SMTP logs with Base64 encoded password
    const errorLog = {
      error: 'Failed to send email',
      details: error.message,
      smtp_log: [
        '220 smtp.example.com ESMTP',
        'EHLO api.example.com',
        '250-AUTH LOGIN PLAIN',
        `250-AUTH LOGIN ${Buffer.from('noreply@example.com').toString('base64')}`,
        // THIS IS THE VULNERABILITY - Base64 encoded password in error response
        `535 Authentication failed: ${Buffer.from('smtp_password_secret_12345').toString('base64')}`,
        'Connection closed'
      ],
      debug_info: {
        smtp_host: 'smtp.example.com',
        smtp_user: 'noreply@example.com',
        // Base64 encoded password leaked in error
        smtp_password_b64: Buffer.from('smtp_password_secret_12345').toString('base64'),
        timestamp: new Date().toISOString()
      }
    };
    
    res.status(500).json(errorLog);
  }
});

// Secure version - no secrets in errors
router.post('/send-email/secure', requireAuth, (req, res) => {
  const { to, subject, body } = req.body;
  
  if (!to || !subject || !body) {
    return res.status(400).json({ 
      error: 'Missing required fields'
    });
  }
  
  try {
    // Email sending logic...
    res.json({ success: true, message: 'Email sent' });
  } catch (error) {
    // Safe error response - no secrets
    res.status(500).json({ 
      error: 'Failed to send email',
      message: 'An error occurred while sending the email. Please try again later.'
    });
  }
});

module.exports = router;

