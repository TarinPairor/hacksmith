const express = require('express');
const router = express.Router();
const { users, serviceAccounts, findServiceAccountByToken } = require('../models/users');
const { orders } = require('../models/orders');
const { requireAuth } = require('../middleware/auth');

// VULNERABILITY #7: Dropbox Sign-style overprivileged service account
// Service accounts with broad access to customer data

router.get('/service/customers', requireAuth, (req, res) => {
  // Check if this is a service account
  if (!req.user.isServiceAccount) {
    return res.status(403).json({ error: 'Service accounts only' });
  }
  
  const serviceAccount = findServiceAccountByToken(req.headers.authorization?.replace('Bearer ', ''));
  
  if (!serviceAccount) {
    return res.status(401).json({ error: 'Invalid service account' });
  }
  
  // VULNERABILITY: Service account has access to ALL customer data
  // No scoping, no restrictions, used for automation
  res.json({
    service_account: serviceAccount.name,
    permissions: serviceAccount.permissions,
    customers: users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      phone: u.phone,
      address: u.address,
      // Should not expose all this data
      password_hash: u.password_hash,
      two_factor_secret: u.two_factor_secret,
      orders: orders.filter(o => o.customer_id === u.id)
    }))
  });
});

// Microsoft Graph-style endpoint (VULNERABILITY #6)
router.get('/service/graph/drive/root/:path', requireAuth, (req, res) => {
  if (!req.user.isServiceAccount) {
    return res.status(403).json({ error: 'Service accounts only' });
  }
  
  const { path } = req.params;
  
  // Suspicious pattern: polling a specific path (potential C2)
  if (path.includes('c2') || path.includes('commands')) {
    // This would be flagged by TestToken Scout as suspicious
    res.json({
      path: path,
      content: Buffer.from('suspicious_command_payload').toString('base64'),
      timestamp: new Date().toISOString(),
      warning: 'This pattern matches known C2 indicators'
    });
  } else {
    res.json({
      path: path,
      content: 'Normal file content',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

