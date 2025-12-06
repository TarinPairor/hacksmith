const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { users, findByEmail, findById } = require('../models/users');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production_12345';

// Login endpoint - realistic workflow
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  const user = findByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // In real app, verify password hash. For demo, accept any password
  // const isValid = await bcrypt.compare(password, user.password_hash);
  // if (!isValid) {
  //   return res.status(401).json({ error: 'Invalid credentials' });
  // }
  
  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  res.json({
    success: true,
    token: token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    }
  });
});

// Get current user
router.get('/me', require('../middleware/auth').requireAuth, (req, res) => {
  const user = findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Return safe user object (no secrets)
  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    created_at: user.created_at
  });
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;

