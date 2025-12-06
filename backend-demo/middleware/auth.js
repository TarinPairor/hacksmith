const jwt = require('jsonwebtoken');
const { users, serviceAccounts, findServiceAccountByToken } = require('../models/users');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production_12345';

// Extract token from header or cookie
const extractToken = (req) => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // Check query parameter (less secure, but some APIs do this)
  if (req.query.token) {
    return req.query.token;
  }
  
  return null;
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Middleware: Require authentication (any valid token)
const requireAuth = (req, res, next) => {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check for service account tokens
  const serviceAccount = findServiceAccountByToken(token);
  if (serviceAccount) {
    req.user = {
      id: serviceAccount.id,
      role: serviceAccount.role,
      permissions: serviceAccount.permissions,
      isServiceAccount: true
    };
    return next();
  }
  
  // Check JWT token
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  const user = users.find(u => u.id === decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  req.user = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: decoded.role || user.role
  };
  
  next();
};

// Middleware: Require specific role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Middleware: Optional auth (doesn't fail if no token, but sets req.user if valid)
const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  
  if (token) {
    const serviceAccount = findServiceAccountByToken(token);
    if (serviceAccount) {
      req.user = {
        id: serviceAccount.id,
        role: serviceAccount.role,
        permissions: serviceAccount.permissions,
        isServiceAccount: true
      };
      return next();
    }
    
    const decoded = verifyToken(token);
    if (decoded) {
      const user = users.find(u => u.id === decoded.userId);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: decoded.role || user.role
        };
      }
    }
  }
  
  next();
};

module.exports = {
  requireAuth,
  requireRole,
  optionalAuth,
  extractToken,
  verifyToken
};

