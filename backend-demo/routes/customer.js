const express = require('express');
const router = express.Router();
const { findById } = require('../models/users');
const { orders } = require('../models/orders');

// VULNERABILITY #5: PandaBuy-style - Endpoint with no authentication at all
router.get('/customer/:id', (req, res) => {
  const { id } = req.params;
  
  const user = findById(id);
  
  if (!user) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  // VULNERABILITY: No auth, full PII exposure
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    address: user.address,
    postcode: user.postcode,
    ip_address: user.ip_address,
    orders: orders.filter(o => o.customer_id === id).map(o => ({
      id: o.id,
      order_number: o.order_number,
      total: o.total,
      status: o.status
    }))
  });
});

module.exports = router;

