// INTENTIONALLY EXPOSED SECRETS FOR DEMO PURPOSES
// DO NOT USE IN PRODUCTION

module.exports = {
  // AWS Credentials
  aws: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1'
  },
  
  // Stripe API Keys
  stripe: {
    publishableKey: 'pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
    secretKey: 'sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
    webhookSecret: 'whsec_1234567890abcdefghijklmnopqrstuvwxyz'
  },
  
  // OAuth Secrets
  oauth: {
    google: {
      clientId: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
      clientSecret: 'GOCSPX-abcdefghijklmnopqrstuvwxyz123456'
    },
    github: {
      clientId: 'Iv1.1234567890abcdef',
      clientSecret: 'abcdef1234567890abcdef1234567890abcdef12'
    }
  },
  
  // JWT Signing Key (should be in env)
  jwtSecret: 'super_secret_jwt_key_change_in_production_12345',
  
  // Database Credentials
  database: {
    host: 'localhost',
    user: 'admin',
    password: 'super_secret_password_123',
    database: 'testdb'
  },
  
  // API Keys
  apiKeys: {
    sendgrid: 'SG.abcdefghijklmnopqrstuvwxyz.1234567890abcdefghijklmnopqrstuvwxyz1234567890',
    twilio: {
      accountSid: 'AC1234567890abcdef1234567890abcdef',
      authToken: 'abcdef1234567890abcdef1234567890'
    }
  },
  
  // Encryption Keys
  encryption: {
    key: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    iv: '0123456789abcdef'
  }
};

