# Scout - API Security Monitoring Platform

**Scout** is a real-time API security monitoring solution that detects data leaks, PII exposure, and sensitive information in API traffic before they become breaches. Built in response to the wave of API security failures in 2024, Scout provides comprehensive visibility into what your APIs are actually exposing.

## 🎯 The Problem

The first half of 2024 saw a pattern of devastating API security breaches:

- **January 2024**: Trello breach - 15 million users compromised via exposed API
- **February**: Spoutible leak - bcrypt password hashes exposed through leaky API
- **March**: GitHub secrets spill - 13 million secrets leaked via public repositories
- **April**: PandaBuy breach - 1.3 million users affected by API vulnerabilities
- **May**: Dropbox Sign breach - API keys and customer data exposed
- **June**: Dell breach - 49 million customer records exposed via API vulnerability

These breaches share a common thread: **APIs leaking sensitive data, and organizations not knowing until it's too late.**

## 🚀 The Solution

Scout provides **real-time detection** of sensitive data leaks in API traffic through a three-component pipeline:

1. **Vulnerable Backend API** - Demo backend with intentional vulnerabilities based on real-world breaches
2. **Proxy Server** - Intercepts and logs all API traffic with full request/response details
3. **Scout Dashboard** - Real-time analysis engine that detects PII, secrets, hashes, and sensitive data

## 📊 Architecture & Pipeline

```
┌─────────────────┐
│   Frontend/API  │
│     Clients     │
└────────┬────────┘
         │
         │ HTTP Requests
         ▼
┌─────────────────┐
│  Proxy Server   │ ◄─── Intercepts all traffic
│                 │      Logs to proxy-access.log
└────────┬────────┘
         │
         │ Forwards requests
         ▼
┌─────────────────┐
│  Backend API    │ ◄─── Vulnerable demo API
│                 │      Based on real breaches
└────────┬────────┘
         │
         │ Response
         ▼
┌─────────────────┐
│  Proxy Server   │ ◄─── Captures response body
│                 │      Logs full context
└────────┬────────┘
         │
         │ Logs to file
         ▼
┌─────────────────┐
│ proxy-access.log │ ◄─── Structured log file
└────────┬────────┘
         │
         │ Real-time analysis
         ▼
┌─────────────────┐
│ Scout Dashboard │ ◄─── Detects PII, secrets,
│                 │      hashes, base64, tokens
└─────────────────┘
```

### Pipeline Flow

1. **Traffic Interception**: All API requests go through the proxy server (port 8080) instead of directly to the backend
2. **Comprehensive Logging**: Proxy captures:
   - Request method, URL, headers, query parameters
   - Full request body (POST/PUT data)
   - Response status, headers, body
   - Timestamps, response times, IP addresses
   - User agents and referrers
3. **Real-time Analysis**: Scout Dashboard reads logs and analyzes them for:
   - **PII**: Emails, phone numbers, SSNs
   - **Secrets**: API keys, tokens, JWTs
   - **Hashes**: MD5, SHA1, SHA256
   - **Base64**: Encoded data with validation and decoding
   - **High-entropy tokens**: Using Shannon entropy analysis (TO check for hashes)
   - **Suspicious fields**: Password, token, secret field names in JSON
4. **Visual Detection**: Dashboard highlights detected sensitive data with color-coded markers, similar to AI-powered PII detection tools

## 🛡️ Vulnerabilities Tackled

Scout is designed to detect vulnerabilities based on **real-world breaches from 2024**:

### 1. **Trello-style Email Enumeration**
- **Issue**: Unauthenticated endpoints leak user existence
- **Detection**: Identifies email addresses in responses and flags enumeration patterns
- **Endpoint**: `GET /api/members/:identifier`

### 2. **Spoutible-style Public API Exposure**
- **Issue**: Public endpoints return full user objects with password hashes
- **Detection**: Detects bcrypt hashes, 2FA secrets, reset tokens in responses
- **Endpoint**: `GET /api/user_profile_box`

### 3. **TTIBI-style Password in Error Logs**
- **Issue**: Error responses contain Base64-encoded passwords
- **Detection**: Validates and decodes Base64 strings, shows decoded preview
- **Endpoint**: `POST /api/send-email`

### 4. **PandaBuy-style Mass Scraping**
- **Issue**: Weak/no authentication, enumerable IDs, no rate limiting
- **Detection**: Flags endpoints with PII exposure, tracks enumeration patterns
- **Endpoints**: `GET /api/orders/:id`, `GET /api/customer/:id`

### 5. **Dell-style Partner Portal Vulnerabilities**
- **Issue**: Enumerable service tags, full PII exposure, no rate limiting
- **Detection**: Identifies customer data leaks in partner endpoints
- **Endpoint**: `GET /api/partner/orders/:serviceTag`

### 6. **Dropbox Sign-style Overprivileged Service Accounts**
- **Issue**: Service accounts with broad access to all customer data
- **Detection**: Flags service account tokens and excessive data access
- **Endpoint**: `GET /api/service/customers`

### 7. **Microsoft Graph-style Cloud API Abuse**
- **Issue**: Service accounts used for file polling (potential C2 indicator)
- **Detection**: Monitors service account usage patterns
- **Endpoint**: `GET /api/service/graph/drive/root/:path`

### 8. **GitHub-style Secrets in Config**
- **Issue**: Hardcoded AWS keys, OAuth secrets, database passwords
- **Detection**: Identifies secrets in request/response bodies
- **Files**: `.env`, `config/` files

## 🔍 Detection Capabilities

Scout uses multiple detection methods:

### Pattern Matching
- **Emails**: `/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g`
- **Phone Numbers**: `/\b\d{10,}\b/g` (10+ consecutive digits)
- **SSNs**: `/\b\d{3}-?\d{2}-?\d{4}\b/g`
- **MD5 Hashes**: `/\b[a-fA-F0-9]{32}\b/g`
- **SHA1 Hashes**: `/\b[a-fA-F0-9]{40}\b/g`
- **SHA256 Hashes**: `/\b[a-fA-F0-9]{64}\b/g`
- **JWT Tokens**: `/\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g`

### Advanced Detection
- **Base64 Validation**: Validates format, length, padding, and attempts decoding
- **Shannon Entropy**: Detects high-entropy tokens (random-looking strings)
- **Suspicious Field Names**: Flags JSON fields like `password`, `token`, `secret`, `apiKey`

## 🏗️ Project Structure

```
hacksmith/
├── backend-demo/          # Vulnerable demo API
│   ├── server.js         # Main backend server
│   ├── proxy-server.js   # Proxy server (intercepts traffic)
│   ├── routes/           # API endpoints (with vulnerabilities)
│   ├── models/           # Data models
│   ├── middleware/       # Auth middleware
│   └── proxy-access.log  # Generated log file
│
├── scout-v2/             # React dashboard
│   ├── src/
│   │   ├── pages/        # Dashboard, LogViewer, Settings
│   │   └── services/     # Log parsing & PII detection
│   └── vite.config.js    # Vite config with log file server
│
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm)

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend-demo
npm install

# Install dashboard dependencies
cd ../scout-v2
pnpm install
```

### 2. Start the Pipeline

**Terminal 1 - Backend API:**
```bash
cd backend-demo
npm start
# Backend runs on http://localhost:3000
```

**Terminal 2 - Proxy Server:**
```bash
cd backend-demo
npm run proxy
# Proxy runs on http://localhost:8080
# Logs to proxy-access.log
```

**Terminal 3 - Scout Dashboard:**
```bash
cd scout-v2
pnpm dev
# Dashboard runs on http://localhost:5173
```

### 3. Generate Traffic

Make requests through the proxy to generate logs:

```bash
# Example: Email enumeration (Trello-style)
curl http://localhost:8080/api/members/alice@example.com

# Example: Public user profile (Spoutible-style)
curl http://localhost:8080/api/user_profile_box?username=alice

# Example: Trigger error with password leak (TTIBI-style)
curl -X POST http://localhost:8080/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

### 4. View Detections

Open the Scout Dashboard at `http://localhost:5173`:
- **Analytics**: See summary statistics and flagged endpoints
- **Log Viewer**: Browse logs with highlighted PII
- **Settings**: Configure detection patterns

## 📈 Dashboard Features

### Analytics Dashboard
- **Summary Statistics**: Total logs, flagged logs, detection rate
- **Most Flagged Endpoints**: Bar chart showing vulnerable endpoints
- **PII Type Distribution**: Pie chart of detected data types
- **Time-based Trends**: Line chart showing leaks over time
- **Configurable Limits**: Top 5, 10, 20, 50 endpoints

### Log Viewer
- **Filtering**: All logs, flagged only, unflagged only
- **Pagination**: 10, 25, 50, 100 logs per page
- **Highlighted PII**: Color-coded highlights in request/response bodies
- **Terminal-style Display**: JSON formatted for readability
- **Expandable Entries**: Click to see full log details

### Settings
- **Pattern Management**: Toggle patterns on/off
- **Custom Patterns**: Add your own detection rules
- **Color Configuration**: Customize highlight colors
- **Persistent Storage**: Settings saved to localStorage

## 🔧 Configuration

### Proxy Server
Configure via environment variables:

```bash
# Change proxy port (default: 8080)
PROXY_PORT=9000 npm run proxy

# Change backend URL (default: http://localhost:3000)
BACKEND_URL=http://localhost:4000 npm run proxy
```

### Detection Patterns
Customize detection in the Settings page of the dashboard, or edit `scout-v2/src/services/piiDetector.js` for default patterns.

## 📚 Documentation

- **[backend-demo/README.md](./backend-demo/README.md)** - Backend API documentation
- **[backend-demo/VULNERABILITY_GUIDE.md](./backend-demo/VULNERABILITY_GUIDE.md)** - Detailed vulnerability explanations
- **[scout-v2/README.md](./scout-v2/README.md)** - Dashboard documentation
- **[scout-v2/OVERVIEW.md](./scout-v2/OVERVIEW.md)** - Technical architecture details
- **[backend-demo/PROXY_SETUP.md](./backend-demo/PROXY_SETUP.md)** - Proxy server setup guide

## 🎯 Use Cases

- **Development Teams**: Catch data leaks during development
- **Security Teams**: Monitor production APIs for unauthorized exposure
- **Compliance**: Demonstrate proactive monitoring for GDPR, CCPA, HIPAA
- **Incident Response**: Identify which endpoints leaked data and when
- **Penetration Testing**: Validate security fixes work correctly

## ⚠️ Important Notes

- **Backend is intentionally vulnerable** - Never deploy to production
- **Proxy logs all traffic** - Use only in development/testing environments
- **Demo purposes only** - Designed for security testing and education

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Proxy**: http-proxy-middleware
- **Dashboard**: React 19, Vite, Recharts
- **Detection**: Advanced regex, Shannon entropy, Base64 validation

## 📝 License

MIT - For educational and demo purposes only

## 🤝 Contributing

This is a hackathon project demonstrating API security monitoring. Contributions and feedback welcome!

---

**Built in response to the API security crisis of 2024. Turn reactive security into proactive monitoring.**
