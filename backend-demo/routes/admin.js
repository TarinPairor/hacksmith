const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { users } = require('../models/users');

// Admin endpoints - some with proper auth, some vulnerable

// Properly secured admin endpoint
router.get('/admin/users', requireAuth, requireRole('admin'), (req, res) => {
  res.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      created_at: u.created_at
    }))
  });
});

// VULNERABLE: Admin endpoint that doesn't check role properly
router.get('/admin/users/vulnerable', requireAuth, (req, res) => {
  // VULNERABILITY: Requires auth but not admin role
  // Any authenticated user can access this
  res.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      phone: u.phone, // PII
      address: u.address, // PII
      role: u.role,
      created_at: u.created_at
    }))
  });
});

// IDOR vulnerability example
router.get('/admin/users/:id', requireAuth, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Properly secured - admin only
  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    phone: user.phone,
    address: user.address,
    role: user.role,
    created_at: user.created_at
  });
});

// IDOR vulnerability - no role check, user can access other users
router.get('/users/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  
  // VULNERABILITY: No check if req.user.id === id
  // User can access other users' data
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    phone: user.phone,
    address: user.address,
    // Should not expose this to other users
    ip_address: user.ip_address,
    last_login: user.last_login
  });
});

module.exports = router;

