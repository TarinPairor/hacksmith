#!/bin/bash

# Test script for TestToken Scout Backend Demo
# This script demonstrates various vulnerability patterns

BASE_URL="http://localhost:3000"

echo "=== TestToken Scout Backend Demo - Test Script ==="
echo ""

# 1. Login to get token
echo "1. Testing Login..."
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"any"}' | jq -r '.token')

echo "Token: $TOKEN"
echo ""

# 2. Trello-style email enumeration
echo "2. Testing Trello-style Email Enumeration..."
echo "Valid email (alice@example.com):"
curl -s $BASE_URL/api/members/alice@example.com | jq '.'
echo ""
echo "Invalid email (fake@example.com):"
curl -s $BASE_URL/api/members/fake@example.com | jq '.'
echo ""

# 3. Spoutible-style public API
echo "3. Testing Spoutible-style Public API (no auth required)..."
curl -s "$BASE_URL/api/user_profile_box?username=alice" | jq '.email, .password_hash, .two_factor_secret'
echo ""

# 4. TTIBI-style password in error
echo "4. Testing TTIBI-style Password in Error Logs..."
curl -s -X POST $BASE_URL/api/send-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}' | jq '.smtp_log, .debug_info.smtp_password_b64'
echo ""

# 5. PandaBuy-style mass scraping
echo "5. Testing PandaBuy-style Mass Scraping..."
echo "Order 1 (no auth required):"
curl -s $BASE_URL/api/orders/1 | jq '.customer.email'
echo "Order 2:"
curl -s $BASE_URL/api/orders/2 | jq '.customer.email'
echo "Customer endpoint (no auth):"
curl -s $BASE_URL/api/customer/1 | jq '.email, .ip_address'
echo ""

# 6. Partner portal enumeration
echo "6. Testing Dell-style Partner Portal..."
PARTNER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"diana@example.com","password":"any"}' | jq -r '.token')
echo "Service tag ABC1234:"
curl -s $BASE_URL/api/partner/orders/ABC1234 \
  -H "Authorization: Bearer $PARTNER_TOKEN" | jq '.customer'
echo ""

# 7. Service account
echo "7. Testing Overprivileged Service Account..."
curl -s $BASE_URL/api/service/customers \
  -H "Authorization: Bearer svc_token_sign_prod_12345" | jq '.customers[0] | {email, password_hash, two_factor_secret}'
echo ""

# 8. IDOR vulnerability
echo "8. Testing IDOR Vulnerability..."
USER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"any"}' | jq -r '.token')
echo "Bob accessing Alice's data (IDOR):"
curl -s $BASE_URL/api/users/1 \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.email, .ip_address'
echo ""

echo "=== Tests Complete ==="

