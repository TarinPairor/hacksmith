# Scout V2 - Log Analysis Dashboard

A React dashboard for analyzing proxy logs, detecting PII, hashes, and sensitive data in real-time.

## Features

- **Log Analysis**: Reads and parses `proxy-access.log` from `backend-demo`
- **PII Detection**: Automatically detects emails, phone numbers, SSNs, hashes, and suspicious fields
- **Analytics Dashboard**: Visualizations of flagged endpoints, PII types, and trends
- **Log Viewer**: View flagged logs with highlighted PII (like PII detection AI tools)
- **Settings**: Configure detection rules, keywords, and regex patterns

## Tech Stack

- **React 19** + **Vite** - Fast development and build
- **Recharts** - Simple charting library
- **React Router** - Client-side routing
- **pnpm** - Package management

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm installed (`npm install -g pnpm`)
- Backend proxy server running (generating logs)

### Installation

```bash
cd scout-v2
pnpm install
pnpm dev
```

Open `http://localhost:5173` in your browser.

### Setup Backend

Make sure your backend proxy is running and generating logs:

```bash
# In backend-demo directory
cd ../backend-demo
npm start          # Start backend on port 3000
npm run proxy      # Start proxy on port 8080 (generates logs)
```

The dashboard will automatically read from `../backend-demo/proxy-access.log`.

## Usage

### Analytics Dashboard
- View summary statistics (total logs, flagged logs, detection rate)
- See most flagged endpoints in bar chart
- View PII type distribution in pie chart
- Track flagged logs over time
- Adjustable limits (Top 5, 10, 20, 50)

### Log Viewer
- Browse all logs or filter by flagged/unflagged
- Expand log entries to see full details
- View highlighted PII in request/response bodies
- Terminal-style JSON display
- Configurable pagination (10, 25, 50, 100 logs)

### Settings
- Toggle detection patterns on/off
- Edit regex patterns
- Change highlight colors
- Add custom detection patterns
- Reset to defaults

## Detection Patterns

Default patterns included:

- **Emails**: `/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g`
- **Phone Numbers**: `/\b\d{10,}\b/g` (10+ consecutive digits)
- **SSNs**: `/\b\d{3}-?\d{2}-?\d{4}\b/g`
- **MD5 Hashes**: `/\b[a-fA-F0-9]{32}\b/g`
- **SHA1 Hashes**: `/\b[a-fA-F0-9]{40}\b/g`
- **SHA256 Hashes**: `/\b[a-fA-F0-9]{64}\b/g`
- **JWT Tokens**: `/\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g`
- **API Tokens**: Pattern matching token/secret field names

Also detects suspicious field names in JSON:
- email, Email, EMail, password, token, secret, id, userId, etc.

## Project Structure

```
scout-v2/
├── src/
│   ├── services/          # Log parsing and PII detection
│   ├── pages/             # Dashboard, LogViewer, Settings
│   └── App.jsx             # Main app component
├── vite.config.js         # Vite config with log file server
└── package.json
```

## Documentation

See [OVERVIEW.md](./OVERVIEW.md) for detailed architecture and implementation details.

## Troubleshooting

### Logs not loading
- Ensure backend proxy is running
- Check that `../backend-demo/proxy-access.log` exists
- Verify Vite dev server is running

### No detections found
- Check Settings page - patterns might be disabled
- Verify log format matches expected structure
- Try refreshing the logs

### Build errors
- Run `pnpm install` to ensure all dependencies are installed
- Check Node.js version (18+ required)
