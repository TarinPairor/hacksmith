const express = require('express');
const router = express.Router();
const { devices, findDeviceByServiceTag } = require('../models/devices');
const { requireAuth, requireRole } = require('../middleware/auth');

// VULNERABILITY #8: Dell-style partner portal with no rate limiting
// Partner endpoint that allows enumeration of service tags with customer PII

router.get('/partner/orders/:serviceTag', requireAuth, requireRole('partner', 'admin'), (req, res) => {
  const { serviceTag } = req.params;
  
  const device = findDeviceByServiceTag(serviceTag);
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  // VULNERABILITY: Returns full customer PII, no rate limiting
  // Service tags are enumerable (7-char alphanumeric)
  res.json({
    service_tag: device.service_tag,
    model: device.model,
    serial_number: device.serial_number,
    warranty_status: device.warranty_status,
    purchase_date: device.purchase_date,
    // PII EXPOSURE - full customer details
    customer: {
      id: device.customer_id,
      name: device.customer_name,
      email: device.customer_email,
      address: device.customer_address
    }
  });
});

// Secure version with rate limiting (would need to be added via middleware)
router.get('/partner/orders/:serviceTag/secure', requireAuth, requireRole('partner', 'admin'), (req, res) => {
  const { serviceTag } = req.params;
  
  const device = findDeviceByServiceTag(serviceTag);
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  // Return minimal info
  res.json({
    service_tag: device.service_tag,
    model: device.model,
    warranty_status: device.warranty_status,
    // No customer PII
  });
});

module.exports = router;

