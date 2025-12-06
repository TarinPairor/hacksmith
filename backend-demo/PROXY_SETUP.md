# Proxy Server Setup Guide

This Node.js proxy server replaces Nginx and provides detailed logging of all requests and responses to your backend.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend-demo
   npm install
   # or
   pnpm install
   ```

2. **Start your backend** (in one terminal):
   ```bash
   npm start
   # Backend runs on http://localhost:3000
   ```

3. **Start the proxy server** (in another terminal):
   ```bash
   npm run proxy
   # Proxy runs on http://localhost:8080
   ```

4. **Access your backend through the proxy:**
   - Direct backend: `http://localhost:3000`
   - Through proxy (with logging): `http://localhost:8080`

## Viewing Logs

### Real-time log monitoring:
```bash
# Watch logs in real-time
./view-proxy-logs.sh -f

# Or use standard tail
tail -f proxy-access.log
```

### View recent logs:
```bash
# Last 20 entries (default)
./view-proxy-logs.sh

# Last 50 entries
./view-proxy-logs.sh -n 50
```

### Search logs:
```bash
# Search for POST requests
./view-proxy-logs.sh -s POST

# Search for specific status codes
./view-proxy-logs.sh -s "STATUS: 404"

# Search for specific endpoints
./view-proxy-logs.sh -s "/api/auth"
```

## Configuration

You can configure the proxy using environment variables:

```bash
# Change proxy port (default: 8080)
PROXY_PORT=9000 npm run proxy

# Change backend URL (default: http://localhost:3000)
BACKEND_URL=http://localhost:4000 npm run proxy

# Both
PROXY_PORT=9000 BACKEND_URL=http://localhost:4000 npm run proxy
```

## What Gets Logged

Each request logs:
- **Timestamp**: ISO format timestamp
- **Request Method & URI**: GET, POST, PUT, DELETE, etc. with full path
- **Response Status**: HTTP status code (200, 404, 500, etc.)
- **Response Size**: Size of response body in bytes
- **Response Time**: Time taken to process the request in seconds
- **Remote Address**: Client IP address
- **User Agent**: Browser/client information
- **Referer**: Where the request came from
- **Content Type**: Request content type
- **Request Body**: Full request body (POST/PUT data)
- **Response Body**: Full response body (what the client sees)

## Example Log Output

```
[2024-12-25T10:30:45.123Z] REQUEST: POST /api/auth/login STATUS: 200 RESPONSE_SIZE: 245 bytes RESPONSE_TIME: 0.023 seconds REMOTE_ADDR: ::1 USER_AGENT: "curl/7.68.0" REFERER: "-" CONTENT_TYPE: "application/json" REQUEST_BODY: "{\"email\":\"user@example.com\",\"password\":\"test123\"}" RESPONSE_BODY: "{\"token\":\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\",\"user\":{\"id\":1,\"email\":\"user@example.com\"}}" ---
```

## Development Mode

For development with auto-reload:
```bash
npm run proxy:dev
```

## Health Check

Check if the proxy is running:
```bash
curl http://localhost:8080/proxy-health
```

This returns:
```json
{
  "status": "ok",
  "timestamp": "2024-12-25T10:30:45.123Z",
  "backend": "http://localhost:3000",
  "logFile": "/path/to/proxy-access.log"
}
```

## Troubleshooting

1. **Proxy can't connect to backend:**
   - Make sure backend is running on port 3000
   - Check: `curl http://localhost:3000/health`

2. **Port 8080 already in use:**
   - Change port: `PROXY_PORT=9000 npm run proxy`
   - Or kill the process using port 8080

3. **Logs not appearing:**
   - Make sure you're making requests to `http://localhost:8080` (not 3000)
   - Check that `proxy-access.log` file exists in the backend-demo directory

4. **Response bodies are truncated:**
   - This is normal for large responses (limited to 1000 chars in logs)
   - Full responses are still proxied correctly to clients

## Advantages Over Nginx

- ✅ No system-level configuration needed
- ✅ Easy to install and run (just `npm install`)
- ✅ Logs both request AND response bodies natively
- ✅ Works on any platform (Windows, Mac, Linux)
- ✅ Easy to customize and extend
- ✅ No sudo/root permissions required
- ✅ Integrated with your Node.js project

## Stopping the Proxy

Press `Ctrl+C` in the terminal where the proxy is running, or:
```bash
# Find and kill the process
lsof -ti:8080 | xargs kill
```

