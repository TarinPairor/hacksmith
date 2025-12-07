const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/members'));
app.use('/api', require('./routes/userProfile'));
app.use('/api', require('./routes/email'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/customer'));
app.use('/api', require('./routes/partner'));
// app.use('/api', require('./routes/service'));
app.use('/api', require('./routes/admin'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TestToken Scout Backend Demo',
    version: '1.0.0',
    description: 'This backend contains intentional vulnerabilities for testing',
    endpoints: {
      auth: '/api/auth',
      members: '/api/members',
      userProfile: '/api/user_profile_box',
      email: '/api/send-email',
      orders: '/api/orders',
      partner: '/api/partner',
      service: '/api/service',
      admin: '/api/admin'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 TestToken Scout Backend Demo running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`⚠️  WARNING: This backend contains intentional vulnerabilities for testing`);
  console.log(`\nVulnerabilities included:`);
  console.log(`  1. Trello-style email enumeration (/api/members/:identifier)`);
  console.log(`  2. TTIBI-style password in error logs (/api/send-email)`);
  console.log(`  3. Spoutible-style public API with full user object (/api/user_profile_box)`);
  console.log(`  4. Secrets in config files (.env, config files)`);
  console.log(`  5. PandaBuy-style mass scraping vulnerabilities (/api/orders, /api/customer)`);
  console.log(`  6. Microsoft Graph-style cloud API patterns (/api/service/graph)`);
  console.log(`  7. Dropbox Sign-style overprivileged service accounts (/api/service/customers)`);
  console.log(`  8. Dell-style partner portal with no rate limiting (/api/partner/orders/:serviceTag)`);
});

