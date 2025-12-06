/**
 * Log Parser Service
 * Parses proxy-access.log files and extracts structured data
 */

export function parseLogLine(line) {
  if (!line || !line.trim()) return null;

  const logEntry = {
    raw: line,
    timestamp: null,
    endpoint: null,
    method: null,
    url: null,
    status: null,
    responseSize: null,
    responseTime: null,
    remoteAddr: null,
    userAgent: null,
    referer: null,
    contentType: null,
    requestBody: null,
    responseBody: null,
  };

  // Extract timestamp
  const timestampMatch = line.match(/\[([^\]]+)\]/);
  if (timestampMatch) {
    logEntry.timestamp = timestampMatch[1];
  }

  // Extract endpoint (METHOD URL)
  const endpointMatch = line.match(/ENDPOINT:\s+([A-Z]+)\s+([^\s]+)/);
  if (endpointMatch) {
    logEntry.method = endpointMatch[1];
    logEntry.url = endpointMatch[2];
    logEntry.endpoint = `${endpointMatch[1]} ${endpointMatch[2]}`;
  }

  // Extract status
  const statusMatch = line.match(/STATUS:\s+(\d+)/);
  if (statusMatch) {
    logEntry.status = parseInt(statusMatch[1], 10);
  }

  // Extract response size
  const sizeMatch = line.match(/RESPONSE_SIZE:\s+([^\s]+)/);
  if (sizeMatch) {
    logEntry.responseSize = sizeMatch[1];
  }

  // Extract response time
  const timeMatch = line.match(/RESPONSE_TIME:\s+([\d.]+)\s+seconds/);
  if (timeMatch) {
    logEntry.responseTime = parseFloat(timeMatch[1]);
  }

  // Extract remote address
  const ipMatch = line.match(/REMOTE_ADDR:\s+([^\s]+)/);
  if (ipMatch) {
    logEntry.remoteAddr = ipMatch[1];
  }

  // Extract user agent
  const uaMatch = line.match(/USER_AGENT:\s+"([^"]+)"/);
  if (uaMatch) {
    logEntry.userAgent = uaMatch[1];
  }

  // Extract referer
  const refererMatch = line.match(/REFERER:\s+"([^"]+)"/);
  if (refererMatch) {
    logEntry.referer = refererMatch[1];
  }

  // Extract content type
  const ctMatch = line.match(/CONTENT_TYPE:\s+"([^"]+)"/);
  if (ctMatch) {
    logEntry.contentType = ctMatch[1];
  }

  // Extract request body
  const reqBodyMatch = line.match(/REQUEST_BODY:\s+"([^"]+)"/);
  if (reqBodyMatch) {
    logEntry.requestBody = reqBodyMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }

  // Extract response body
  const resBodyMatch = line.match(/RESPONSE_BODY:\s+"([^"]+)"/);
  if (resBodyMatch) {
    logEntry.responseBody = resBodyMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }

  return logEntry;
}

export async function readLogFile(filePath) {
  try {
    // In browser, we'll need to use fetch or FileReader
    // For now, we'll assume the backend will serve the log file
    const response = await fetch(`/api/logs?path=${encodeURIComponent(filePath)}`);
    if (!response.ok) {
      throw new Error('Failed to read log file');
    }
    const text = await response.text();
    return text.split('\n').filter(line => line.trim());
  } catch (error) {
    console.error('Error reading log file:', error);
    // Fallback: try to read from a public endpoint or use mock data
    return [];
  }
}

export function parseLogs(logLines) {
  return logLines
    .map(parseLogLine)
    .filter(entry => entry !== null && entry.timestamp);
}

