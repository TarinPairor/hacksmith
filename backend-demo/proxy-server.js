const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PROXY_PORT = process.env.PROXY_PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const LOG_FILE = path.join(__dirname, 'proxy-access.log');

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '');
}

// Middleware to capture request body BEFORE proxy middleware
// This must be before the proxy to capture the body
const bodyParser = express.json({ limit: '10mb' });
const textParser = express.text({ limit: '10mb' });
const urlEncodedParser = express.urlencoded({ extended: true, limit: '10mb' });

// Middleware - match server.js setup
app.use(cors());
app.use(cookieParser());

// Middleware to capture original URL with query string before any processing
app.use((req, res, next) => {
    // Store the original URL with query string
    if (!req.originalUrl) {
        req.originalUrl = req.url;
    }
    // Also store the full URL including query
    req._fullUrl = req.originalUrl || req.url;
    next();
});

// Parse body for logging - this will consume the stream
// We'll manually forward it in onProxyReq
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper function to format log entry
function formatLogEntry(req, res, responseBody = null, responseTime = null) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    
    // Get full URL with query parameters
    // Use the stored full URL or construct from originalUrl/url
    let fullUrl = req._fullUrl || req.originalUrl || req.url || '/';
    
    // Ensure we have the query string - check if it's missing
    if (!fullUrl.includes('?') && req.query && Object.keys(req.query).length > 0) {
        const queryString = Object.keys(req.query)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(req.query[key])}`)
            .join('&');
        fullUrl = fullUrl + '?' + queryString;
    }
    
    const status = res.statusCode;
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || '-';
    const referer = req.headers['referer'] || req.headers['referrer'] || '-';
    
    // Get request body (handle different content types)
    // Always log body for POST, PUT, PATCH requests
    let requestBody = '-';
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
    
    // Use parsed body if available, otherwise try req.body
    const bodyToLog = req._parsedBody || req.body;
    
    if (bodyToLog) {
        if (typeof bodyToLog === 'object' && Object.keys(bodyToLog).length > 0) {
            requestBody = JSON.stringify(bodyToLog, null, 2);
        } else if (typeof bodyToLog === 'string' && bodyToLog.length > 0) {
            requestBody = bodyToLog;
        } else if (bodyToLog) {
            requestBody = String(bodyToLog);
        }
        
        // Truncate if too long (but keep more for POST requests)
        const maxLength = hasBody ? 5000 : 1000;
        if (requestBody.length > maxLength) {
            requestBody = requestBody.substring(0, maxLength) + '... [truncated]';
        }
    } else if (hasBody) {
        // For POST/PUT/PATCH, log that body is empty
        requestBody = '[empty body]';
    }
    
    // Format response body
    let formattedResponseBody = '-';
    if (responseBody) {
        if (typeof responseBody === 'object') {
            formattedResponseBody = JSON.stringify(responseBody);
        } else {
            formattedResponseBody = String(responseBody);
        }
        // Truncate if too long
        if (formattedResponseBody.length > 1000) {
            formattedResponseBody = formattedResponseBody.substring(0, 1000) + '... [truncated]';
        }
    }
    
    // Get response size
    const responseSize = res.get('content-length') || '-';
    
    // Build log entry with endpoint prominently displayed
    const logEntry = [
        `[${timestamp}]`,
        `ENDPOINT: ${method} ${fullUrl}`,
        `STATUS: ${status}`,
        `RESPONSE_SIZE: ${responseSize} bytes`,
        responseTime ? `RESPONSE_TIME: ${responseTime.toFixed(3)} seconds` : '',
        `REMOTE_ADDR: ${ip}`,
        `USER_AGENT: "${userAgent}"`,
        `REFERER: "${referer}"`,
        `CONTENT_TYPE: "${req.headers['content-type'] || '-'}"`,
        hasBody ? `REQUEST_BODY: "${requestBody.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"` : '',
        responseBody ? `RESPONSE_BODY: "${formattedResponseBody.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"` : '',
        `---`
    ].filter(Boolean).join(' ');
    
    return logEntry;
}

// Helper function to write log
function writeLog(entry) {
    const logLine = entry + '\n';
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
    // Also output to console with colors
    console.log(entry);
}

// Middleware to track request start time
function requestTracker(req, res, next) {
    req._startTime = Date.now();
    req._responseBody = null;
    next();
}

// Health check endpoint (must be before proxy to avoid proxying)
app.get('/proxy-health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        backend: BACKEND_URL,
        logFile: LOG_FILE
    });
});

// Apply request tracker middleware
app.use(requestTracker);

// Set up response logging BEFORE proxy (so we can attach finish listener)
app.use((req, res, next) => {
    // Log when response finishes
    res.on('finish', () => {
        const responseTime = req._startTime ? (Date.now() - req._startTime) / 1000 : null;
        const logEntry = formatLogEntry(req, res, req._responseBody, responseTime);
        writeLog(logEntry);
    });
    next();
});

// Proxy middleware configuration
const proxyOptions = {
    target: BACKEND_URL,
    changeOrigin: true,
    ws: true, // Enable websocket proxying
    logLevel: 'silent', // We handle logging ourselves
    onProxyReq: (proxyReq, req, res) => {
        // Add cache-busting headers to force fresh responses (so we can capture body)
        proxyReq.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        proxyReq.setHeader('Pragma', 'no-cache');
        proxyReq.setHeader('Expires', '0');
        
        // Since we parsed the body (which consumed the stream), we need to manually forward it
        if (req.body) {
            let bodyData;
            if (typeof req.body === 'string') {
                bodyData = req.body;
            } else if (Buffer.isBuffer(req.body)) {
                bodyData = req.body;
            } else if (Object.keys(req.body).length > 0) {
                bodyData = JSON.stringify(req.body);
            }
            
            if (bodyData && bodyData.length > 0) {
                // Remove Content-Length header if present, we'll set it correctly
                proxyReq.removeHeader('Content-Length');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        // Copy headers from backend response
        Object.keys(proxyRes.headers).forEach(key => {
            // Skip certain headers that Express manages
            if (key.toLowerCase() !== 'connection') {
                res.setHeader(key, proxyRes.headers[key]);
            }
        });
        res.statusCode = proxyRes.statusCode;
        
        // Capture response body by intercepting the response stream
        const chunks = [];
        
        // Intercept res.write and res.end to capture body
        const originalWrite = res.write.bind(res);
        const originalEnd = res.end.bind(res);
        
        res.write = function(chunk, encoding, callback) {
            if (chunk) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
            }
            return originalWrite(chunk, encoding, callback);
        };
        
        res.end = function(chunk, encoding, callback) {
            if (chunk) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
            }
            
            // Store captured body
            if (chunks.length > 0) {
                try {
                    const buffer = Buffer.concat(chunks);
                    let bodyText = buffer.toString('utf8');
                    if (bodyText.trim()) {
                        try {
                            req._responseBody = JSON.parse(bodyText);
                        } catch (e) {
                            req._responseBody = bodyText;
                        }
                    } else {
                        req._responseBody = null;
                    }
                } catch (e) {
                    req._responseBody = '[unable to parse response]';
                }
            } else {
                req._responseBody = null;
            }
            
            return originalEnd(chunk, encoding, callback);
        };
        
        // Also try to capture from proxyRes stream (for cases where proxy handles it differently)
        proxyRes.on('data', (chunk) => {
            if (chunk && chunks.length === 0) {
                // Only capture if we haven't captured from res.write/res.end
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
        });
        
        proxyRes.on('end', () => {
            // Finalize if we captured from proxyRes
            if (chunks.length > 0 && !req._responseBody) {
                try {
                    const buffer = Buffer.concat(chunks);
                    let bodyText = buffer.toString('utf8');
                    if (bodyText.trim()) {
                        try {
                            req._responseBody = JSON.parse(bodyText);
                        } catch (e) {
                            req._responseBody = bodyText;
                        }
                    }
                } catch (e) {
                    req._responseBody = '[unable to parse response]';
                }
            }
        });
    },
    onError: (err, req, res) => {
        // Extract detailed error information
        let errorMessage = err.message || err.toString();
        let errorDetails = '';
        
        // Handle AggregateError (multiple errors)
        if (err.name === 'AggregateError' || err.constructor.name === 'AggregateError') {
            errorMessage = 'Connection failed to backend';
            if (err.errors && err.errors.length > 0) {
                errorDetails = err.errors.map(e => e.message || e.toString()).join('; ');
            } else {
                errorDetails = 'Unable to connect to ' + BACKEND_URL + '. Is the backend server running?';
            }
        } else if (err.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused';
            errorDetails = `Cannot connect to backend at ${BACKEND_URL}. Make sure the backend server is running on port 3000.`;
        } else if (err.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timeout';
            errorDetails = `Backend at ${BACKEND_URL} did not respond in time.`;
        } else if (err.code === 'ENOTFOUND') {
            errorMessage = 'Host not found';
            errorDetails = `Cannot resolve backend host: ${BACKEND_URL}`;
        }
        
        console.error('Proxy error:', errorMessage);
        if (errorDetails) {
            console.error('Error details:', errorDetails);
        }
        console.error('Full error:', err);
        
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ERROR: ${errorMessage}${errorDetails ? ' - ' + errorDetails : ''} - ${req.method} ${req.url}`;
        writeLog(logEntry);
        
        // Only send error if response hasn't been sent
        if (!res.headersSent) {
            res.status(502).json({ 
                error: 'Proxy error', 
                message: errorMessage,
                details: errorDetails || undefined,
                backend: BACKEND_URL,
                hint: 'Make sure the backend server is running on port 3000'
            });
        }
    }
};

// Apply proxy to all routes (except /proxy-health which is handled above)
app.use('/', createProxyMiddleware(proxyOptions));

// Check if backend is reachable before starting
const http = require('http');

function checkBackend(callback) {
    const url = new URL(BACKEND_URL);
    const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: '/health',
        method: 'GET',
        timeout: 2000
    };
    
    const req = http.request(options, (res) => {
        callback(null, true);
        req.destroy();
    });
    
    req.on('error', (err) => {
        callback(err, false);
    });
    
    req.on('timeout', () => {
        req.destroy();
        callback(new Error('Backend health check timeout'), false);
    });
    
    req.end();
}

// Start server
app.listen(PROXY_PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PROXY_PORT}`);
    console.log(`📋 Proxying to backend: ${BACKEND_URL}`);
    console.log(`📝 Logging to: ${LOG_FILE}`);
    console.log(`💡 View logs: tail -f ${LOG_FILE}`);
    console.log(`\n⚠️  All requests will be logged with full details`);
    console.log(`\n🔍 Checking backend connectivity...`);
    
    // Check backend after a short delay
    setTimeout(() => {
        checkBackend((err, isReachable) => {
            if (err || !isReachable) {
                console.error(`\n❌ WARNING: Cannot reach backend at ${BACKEND_URL}`);
                console.error(`   Error: ${err ? err.message : 'Connection failed'}`);
                console.error(`   Make sure the backend server is running:`);
                console.error(`   cd backend-demo && npm start`);
            } else {
                console.log(`\n✅ Backend is reachable at ${BACKEND_URL}`);
            }
        });
    }, 1000);
});

