# Scout V2 - Implementation Overview

## Architecture

### Tech Stack
- **React 19** + **Vite** - Fast development and build
- **Recharts** - Simple, lightweight charting library
- **React Router** - Client-side routing
- **pnpm** - Fast, efficient package management

### Project Structure
```
scout-v2/
├── src/
│   ├── services/
│   │   ├── logService.js      # Log file reading and parsing
│   │   ├── logParser.js       # Log line parsing utilities
│   │   └── piiDetector.js     # PII/hash detection engine
│   ├── pages/
│   │   ├── Dashboard.jsx      # Analytics with charts
│   │   ├── LogViewer.jsx      # Log viewer with highlighted PII
│   │   └── Settings.jsx        # Detection pattern configuration
│   ├── App.jsx                # Main app with routing
│   ├── App.css                # Global styles
│   └── main.jsx               # Entry point
├── vite.config.js             # Vite config with log file server plugin
└── package.json
```

## How It Works

### 1. Log Reading
- Vite plugin (`vite.config.js`) serves `/api/logs` endpoint
- Reads `../backend-demo/proxy-access.log` file
- Returns raw log content as text

### 2. Log Parsing
- `logService.js` fetches and parses log content
- `parseLogContent()` extracts structured data from each log line:
  - Timestamp, endpoint, method, URL
  - Status code, response size, response time
  - Request/response bodies
  - Headers (user agent, referer, etc.)

### 3. PII Detection
- `piiDetector.js` contains detection patterns:
  - **Emails**: `/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g`
  - **Phone Numbers**: `/\b\d{10,}\b/g` (10+ consecutive digits)
  - **SSNs**: `/\b\d{3}-?\d{2}-?\d{4}\b/g`
  - **MD5**: `/\b[a-fA-F0-9]{32}\b/g`
  - **SHA1**: `/\b[a-fA-F0-9]{40}\b/g`
  - **SHA256**: `/\b[a-fA-F0-9]{64}\b/g`
  - **JWT**: `/\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g`
  - **API Tokens**: Pattern matching token/secret field names

- Also detects suspicious field names in JSON:
  - email, Email, password, token, secret, id, etc.

### 4. Dashboard Features

#### Analytics Page
- **Summary Cards**: Total logs, flagged logs, detection rate, total detections
- **Bar Chart**: Most flagged endpoints (top N, configurable)
- **Pie Chart**: PII type distribution
- **Line Chart**: Flagged logs over time
- **Table**: Detailed endpoint statistics

#### Log Viewer Page
- **Filtering**: All logs, flagged only, unflagged only
- **Pagination**: Configurable limit (10, 25, 50, 100)
- **Highlighted PII**: 
  - Color-coded highlights in request/response bodies
  - Terminal-style JSON display
  - Expandable log entries
  - Shows detection types with color badges

#### Settings Page
- **Pattern Management**:
  - Toggle patterns on/off
  - Edit regex patterns
  - Change highlight colors
  - Add custom patterns
  - Remove custom patterns (defaults protected)
- **Persistent Storage**: Settings saved to localStorage

## Detection Flow

1. **Load Logs**: Fetch from `/api/logs` endpoint
2. **Parse**: Convert raw log lines to structured objects
3. **Analyze**: Run PII detection on each log entry
4. **Flag**: Mark logs with detected PII
5. **Display**: Show in dashboard/log viewer with highlights

## Data Flow

```
proxy-access.log (backend-demo)
    ↓
Vite Plugin (/api/logs)
    ↓
logService.parseLogContent()
    ↓
piiDetector.analyzeLogs()
    ↓
React Components (Dashboard/LogViewer)
    ↓
User Interface
```

## Key Features

### 1. Real-time Log Analysis
- Reads directly from proxy log file
- Automatic parsing and detection
- Refresh button to reload logs

### 2. Visual PII Highlighting
- Color-coded highlights (like PII detection AI)
- Different colors for different PII types
- Highlights in URL, request body, response body

### 3. Configurable Detection
- Add/remove/edit detection patterns
- Toggle patterns on/off
- Custom regex support
- Persistent settings

### 4. Analytics & Insights
- Most flagged endpoints
- PII type distribution
- Time-based trends
- Detection statistics

## Usage

### Development
```bash
cd scout-v2
pnpm install
pnpm dev
```

### Access
- Open `http://localhost:5173` (or Vite's default port)
- Navigate between Analytics, Log Viewer, and Settings

### Requirements
- Backend proxy server must be running and generating logs
- Log file must exist at `../backend-demo/proxy-access.log`

## Customization

### Adding New Detection Patterns
1. Go to Settings page
2. Enter pattern name and regex
3. Choose highlight color
4. Click "Add Pattern"

### Modifying Default Patterns
1. Go to Settings page
2. Toggle pattern on/off
3. Edit regex pattern
4. Change highlight color
5. Changes saved automatically

### Styling
- Dark theme optimized
- Colors defined in `piiDetector.js` (DEFAULT_PATTERNS)
- Global styles in `App.css`
- Component styles inline (can be extracted to CSS modules)

## Future Enhancements

- Real-time log streaming (WebSocket)
- Export flagged logs to CSV/JSON
- Alert system for critical PII leaks
- Advanced filtering (by endpoint, PII type, date range)
- Log file upload (for analyzing historical logs)
- Multi-file support
- Detection confidence scores
- Machine learning-based detection

