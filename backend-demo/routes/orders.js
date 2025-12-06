const express = require('express');
const router = express.Router();
const { orders, findOrderById, findOrderByNumber } = require('../models/orders');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { findById } = require('../models/users');

// VULNERABILITY #5: PandaBuy-style mass scraping vulnerabilities
// Multiple issues: weak auth, enumerable IDs, PII exposure, no rate limiting

// Endpoint with weak authentication check
router.get('/orders/:id', optionalAuth, (req, res) => {
  const { id } = req.params;
  
  const order = findOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  // VULNERABILITY: Should check if user owns this order, but doesn't
  // Also returns full customer PII
  res.json({
    id: order.id,
    order_number: order.order_number,
    // PII EXPOSURE - full customer details
    customer: {
      id: order.customer_id,
      name: order.customer_name,
      email: order.customer_email,
      address: order.customer_address,
      phone: order.customer_phone
    },
    items: order.items,
    total: order.total,
    status: order.status,
    created_at: order.created_at
  });
});

module.exports = router;

// Secure version with proper auth and IDOR protection
router.get('/orders/:id/secure', requireAuth, (req, res) => {
  const { id } = req.params;
  
  const order = findOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  // IDOR PROTECTION: Check if user owns this order (unless admin)
  if (req.user.role !== 'admin' && order.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Return minimal info for non-owners
  if (req.user.role !== 'admin') {
    return res.json({
      id: order.id,
      order_number: order.order_number,
      items: order.items,
      total: order.total,
      status: order.status,
      created_at: order.created_at
    });
  }
  
  // Admin gets full details
  const customer = findById(order.customer_id);
  res.json({
    id: order.id,
    order_number: order.order_number,
    customer: {
      id: order.customer_id,
      name: order.customer_name,
      email: order.customer_email
    },
    items: order.items,
    total: order.total,
    status: order.status,
    created_at: order.created_at
  });
});

module.exports = router;

