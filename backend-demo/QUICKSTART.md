# Quick Start Guide

## Installation

```bash
cd backend-demo
npm install
```

## Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

## Quick Test

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"any"}'
```

### 3. Test Vulnerabilities

#### Email Enumeration (Trello-style)
```bash
# Valid email
curl http://localhost:3000/api/members/alice@example.com

# Invalid email (different response = enumeration risk)
curl http://localhost:3000/api/members/fake@example.com
```

#### Public User Object (Spoutible-style)
```bash
# No auth required, returns secrets
curl "http://localhost:3000/api/user_profile_box?username=alice"
```

#### Mass Scraping (PandaBuy-style)
```bash
# Enumerate orders (no auth)
curl http://localhost:3000/api/orders/1
curl http://localhost:3000/api/orders/2

# Enumerate customers (no auth)
curl http://localhost:3000/api/customer/1
```

#### Partner Portal (Dell-style)
```bash
# Login as partner
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"diana@example.com","password":"any"}' | jq -r '.token')

# Enumerate service tags
curl http://localhost:3000/api/partner/orders/ABC1234 \
  -H "Authorization: Bearer $TOKEN"
```

## Run Test Script

```bash
./test-endpoints.sh
```

## Test Users

| Email | Role | ID |
|-------|------|-----|
| alice@example.com | admin | 1 |
| bob@example.com | user | 2 |
| charlie@example.com | user | 3 |
| diana@example.com | partner | 4 |

All passwords: `any` (no validation for demo)

## Service Accounts

- Token: `svc_token_sign_prod_12345` (SIGN_PROD_SVC_ACCOUNT)
- Token: `svc_token_graph_api_67890` (GRAPH_API_SVC_ACCOUNT)

## What TestToken Scout Should Detect

1. ✅ Missing auth on `/api/members/:identifier`
2. ✅ Missing auth on `/api/user_profile_box`
3. ✅ Missing auth on `/api/orders/:id`
4. ✅ Missing auth on `/api/customer/:id`
5. ✅ Secrets in `.env` and `config/` files
6. ✅ PII in responses (email, phone, address, password_hash, etc.)
7. ✅ Enumerable IDs (orders 1-1000, customers 1-4, service tags)
8. ✅ No rate limiting on partner endpoints
9. ✅ IDOR on `/api/users/:id`
10. ✅ Secrets in error responses (`/api/send-email`)
11. ✅ Overprivileged service accounts

