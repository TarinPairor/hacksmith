const express = require('express');
const router = express.Router();
const { users, findByEmail, findById } = require('../models/users');
const { optionalAuth } = require('../middleware/auth');

// VULNERABILITY #1: Trello-style email enumeration
// This endpoint is unauthenticated and leaks user existence via email
router.get('/members/:identifier', optionalAuth, (req, res) => {
  const { identifier } = req.params;
  /* The comment `// Try to find by email` is indicating that the code is attempting to find a user by
  their email address. This is part of the logic in the endpoint `/members/:identifier` where it
  first tries to locate a user based on the provided identifier, which could be an email, username,
  or ID. */
  
  // Try to find by email first
  let user = findByEmail(identifier);
  
  // If not found by email, try username
  if (!user) {
    user = users.find(u => u.username === identifier);
  }
  
  // If not found by username, try ID
  if (!user) {
    user = findById(identifier);
  }
  
  if (!user) {
    // DIFFERENT RESPONSE FOR NON-EXISTENT USERS - ENUMERATION VULNERABILITY
    return res.status(404).json({
      error: 'Member not found',
      message: `No member found with identifier: ${identifier}`
    });
  }
  
  // Return profile info (should require auth, but doesn't)
  res.json({
    id: user.id,
    username: user.username,
    email: user.email, // LEAKS EMAIL
    avatar: `https://api.example.com/avatars/${user.id}.png`,
    full_name: user.username,
    bio: `This is ${user.username}'s profile`,
    member_since: user.created_at,
    // Additional info that shouldn't be public
    last_seen: user.last_login
  });
});

// Secure version (requires auth)
router.get('/members/:identifier/secure', require('../middleware/auth').requireAuth, (req, res) => {
  const { identifier } = req.params;
  const user = findById(identifier) || findByEmail(identifier);
  
  if (!user) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  // Only return public info
  res.json({
    id: user.id,
    username: user.username,
    avatar: `https://api.example.com/avatars/${user.id}.png`,
    member_since: user.created_at
  });
});

module.exports = router;

