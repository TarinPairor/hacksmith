const express = require('express');
const router = express.Router();
const { users, findById, findByUsername } = require('../models/users');
const { optionalAuth } = require('../middleware/auth');

// VULNERABILITY #3: Spoutible-style public API returning full user object
// This endpoint is public but returns ALL user data including secrets
router.get('/user_profile_box', optionalAuth, (req, res) => {
  const { username, user_id } = req.query;
  
  let user = null;
  if (user_id) {
    user = findById(user_id);
  } else if (username) {
    user = findByUsername(username);
  }
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // CATASTROPHIC: Return full user object with all PII and secrets
  // This should NEVER be exposed, especially not publicly
  res.json({
    id: user.id,
    username: user.username,
    email: user.email, // PII
    phone: user.phone, // PII
    address: user.address, // PII
    postcode: user.postcode, // PII
    ip_address: user.ip_address, // PII
    password: user.password_hash, // SECRET - password hash exposed
    password_hash: user.password_hash, // SECRET
    two_factor_secret: user.two_factor_secret, // SECRET
    backup_codes: user.backup_codes, // SECRET
    em_code: user.em_code, // SECRET
    reset_token: user.reset_token, // SECRET
    auth_token: user.auth_token, // SECRET
    last_login: user.last_login,
    role: user.role,
    created_at: user.created_at
  });
});

// Secure version - minimal public info only
router.get('/user_profile_box/secure', optionalAuth, (req, res) => {
  const { username, user_id } = req.query;
  
  let user = null;
  if (user_id) {
    user = findById(user_id);
  } else if (username) {
    user = findByUsername(username);
  }
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Only return safe public info
  res.json({
    id: user.id,
    username: user.username,
    avatar: `https://api.example.com/avatars/${user.id}.png`,
    created_at: user.created_at
  });
});

module.exports = router;

