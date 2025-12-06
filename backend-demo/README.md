# TestToken Scout Backend Demo

This is a **demo backend** with **intentional vulnerabilities** designed to test the TestToken Scout security scanning tool. **DO NOT USE IN PRODUCTION**.

## 📚 Documentation

- **[VULNERABILITY_GUIDE.md](./VULNERABILITY_GUIDE.md)** - **Comprehensive guide** with commands, expected outputs, and detailed explanations of why each vulnerability is dangerous
- **[COMMANDS_REFERENCE.md](./COMMANDS_REFERENCE.md)** - Quick reference card with all commands in one place
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick reference for getting started
- **[README.md](./README.md)** - This file (overview and setup)

## 🚨 Warning

This backend contains multiple security vulnerabilities by design. It is intended for:
- Testing security scanning tools
- Demonstrating common API security issues
- Educational purposes

**Never deploy this to production or expose it to the internet.**

## Vulnerabilities Included

This backend demonstrates 8 real-world vulnerability patterns:

### 1. Trello-style Email Enumeration
- **Endpoint**: `GET /api/members/:identifier`
- **Issue**: Unauthenticated endpoint that leaks user existence via different responses for valid/invalid emails
- **Test**: Try `/api/members/alice@example.com` vs `/api/members/fake@example.com`

### 2. TTIBI-style Password in Error Logs
- **Endpoint**: `POST /api/send-email`
- **Issue**: Error responses contain SMTP logs with Base64-encoded passwords
- **Test**: Send malformed request to trigger error, check response body

### 3. Spoutible-style Public API with Full User Object
- **Endpoint**: `GET /api/user_profile_box`
- **Issue**: Public endpoint returns complete user object including password hashes, 2FA secrets, reset tokens
- **Test**: `GET /api/user_profile_box?username=alice` (no auth required)

### 4. GitHub-style Secrets in Config
- **Files**: `.env`, `config/` files
- **Issue**: Hardcoded AWS keys, OAuth secrets, database passwords in config files
- **Test**: Check `.env` file and config files

### 5. PandaBuy-style Mass Scraping Vulnerabilities
- **Endpoints**: 
  - `GET /api/orders/:id` (weak auth)
  - `GET /api/customer/:id` (no auth)
- **Issues**: 
  - Weak/no authentication
  - Enumerable IDs
  - Full PII exposure
  - No rate limiting
- **Test**: Enumerate order IDs 1-100, customer IDs 1-4

### 6. Microsoft Graph-style Cloud API Patterns
- **Endpoint**: `GET /api/service/graph/drive/root/:path`
- **Issue**: Service account with high privileges used for file polling (potential C2 indicator)
- **Test**: Use service account token, poll paths like `/c2/commands.txt`

### 7. Dropbox Sign-style Overprivileged Service Account
- **Endpoint**: `GET /api/service/customers`
- **Issue**: Service account has broad access to all customer data without scoping
- **Test**: Use service account token: `svc_token_sign_prod_12345`

### 8. Dell-style Partner Portal with No Rate Limiting
- **Endpoint**: `GET /api/partner/orders/:serviceTag`
- **Issues**: 
  - Enumerable service tags (7-char alphanumeric)
  - Full customer PII in responses
  - No rate limiting
- **Test**: Enumerate service tags, send rapid requests

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Authentication

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "any"
}
```

Returns a JWT token and sets a cookie.

### Test Users

| Email | Password | Role | ID |
|-------|----------|------|-----|
| alice@example.com | any | admin | 1 |
| bob@example.com | any | user | 2 |
| charlie@example.com | any | user | 3 |
| diana@example.com | any | partner | 4 |

### Service Accounts

| Token | Name | Permissions |
|-------|------|-------------|
| svc_token_sign_prod_12345 | SIGN_PROD_SVC_ACCOUNT | read:all, write:all, admin:all |
| svc_token_graph_api_67890 | GRAPH_API_SVC_ACCOUNT | read:all, write:all |

## Example Requests

### 1. Email Enumeration (Trello-style)
```bash
# Valid email - returns user data
curl http://localhost:3000/api/members/alice@example.com

# Invalid email - different response
curl http://localhost:3000/api/members/fake@example.com
```

### 2. Public User Object (Spoutible-style)
```bash
# No auth required, returns full user object with secrets
curl http://localhost:3000/api/user_profile_box?username=alice
```

### 3. Password in Error (TTIBI-style)
```bash
# Trigger error to see SMTP logs with Base64 password
curl -X POST http://localhost:3000/api/send-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

### 4. Mass Scraping (PandaBuy-style)
```bash
# Enumerate orders (no auth check)
curl http://localhost:3000/api/orders/1
curl http://localhost:3000/api/orders/2
# ... etc

# Enumerate customers (no auth)
curl http://localhost:3000/api/customer/1
curl http://localhost:3000/api/customer/2
```

### 5. Partner Portal Enumeration (Dell-style)
```bash
# Enumerate service tags (requires partner token)
curl http://localhost:3000/api/partner/orders/ABC1234 \
  -H "Authorization: Bearer PARTNER_TOKEN"

# Try adjacent tags
curl http://localhost:3000/api/partner/orders/ABC1235 \
  -H "Authorization: Bearer PARTNER_TOKEN"
```

### 6. Overprivileged Service Account
```bash
curl http://localhost:3000/api/service/customers \
  -H "Authorization: Bearer svc_token_sign_prod_12345"
```

## Configuration

The `config/scout.yml` file contains test configuration for TestToken Scout:
- Known tokens per role
- Test user IDs
- Safety limits
- Wordlists

## Secure Endpoints

Some endpoints have `/secure` variants that demonstrate proper security:
- `/api/members/:identifier/secure` - Requires auth
- `/api/user_profile_box/secure` - Returns minimal public info
- `/api/orders/:id/secure` - Proper IDOR protection
- `/api/send-email/secure` - No secrets in errors

## Project Structure

```
backend-demo/
├── server.js              # Main server file
├── models/
│   ├── users.js          # User data with PII
│   ├── orders.js         # Order data
│   └── devices.js        # Device/service tag data
├── routes/
│   ├── auth.js           # Authentication endpoints
│   ├── members.js        # Trello-style enumeration
│   ├── userProfile.js    # Spoutible-style exposure
│   ├── email.js          # TTIBI-style error logs
│   ├── orders.js         # PandaBuy-style scraping
│   ├── partner.js        # Dell-style partner portal
│   ├── service.js        # Service account endpoints
│   └── admin.js          # Admin endpoints (some vulnerable)
├── middleware/
│   └── auth.js           # Authentication middleware
├── config/
│   └── scout.yml         # TestToken Scout config
└── .env                  # Secrets (intentionally exposed)
```

## Testing with TestToken Scout

This backend is designed to be scanned by TestToken Scout. The tool should detect:

1. ✅ Missing authentication on sensitive endpoints
2. ✅ IDOR vulnerabilities
3. ✅ Email enumeration risks
4. ✅ PII/secrets in responses
5. ✅ Secrets in code/config files
6. ✅ Enumerable identifiers
7. ✅ Missing rate limiting
8. ✅ Overprivileged service accounts

## Notes

- All passwords are accepted (no real validation)
- JWT tokens are signed with a weak secret (for demo)
- Database is in-memory (data resets on restart)
- Rate limiting is intentionally missing on vulnerable endpoints
- Secrets are intentionally hardcoded for detection

## License

MIT - For educational/demo purposes only

