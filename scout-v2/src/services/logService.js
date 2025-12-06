/**
 * Log Service
 * Handles reading logs from the backend-demo proxy-access.log file
 */

const LOG_FILE_PATH = '../backend-demo/proxy-access.log';

export async function fetchLogs() {
  try {
    // Try to read from a local file (for development)
    // In production, this would be an API endpoint
    const response = await fetch('/api/logs');
    if (response.ok) {
      const text = await response.text();
      return text.split('\n').filter(line => line.trim());
    }
  } catch (error) {
    console.error(error)
    console.warn('API endpoint not available, using mock data');
  }

  // Fallback: return empty array or mock data
  return [];
}

// For development: read from file system via Vite's file serving
export async function readLogsFromFile() {
  try {
    // In Vite, we can use import.meta.env to get the base URL
    // For now, we'll use a simple fetch to a local endpoint
    // This would need a backend API or Vite plugin to read files
    
    // Mock implementation - in real app, this would be an API call
    return [];
  // eslint-disable-next-line no-unreachable
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
}

// Parse log file content (assumes we have the raw text)
export function parseLogContent(content) {
  if (!content) return [];
  
  const lines = content.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const entry = {
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
      entry.timestamp = timestampMatch[1];
    }

    // Extract endpoint
    const endpointMatch = line.match(/ENDPOINT:\s+([A-Z]+)\s+([^\s]+)/);
    if (endpointMatch) {
      entry.method = endpointMatch[1];
      entry.url = endpointMatch[2];
      entry.endpoint = `${endpointMatch[1]} ${endpointMatch[2]}`;
    }

    // Extract status
    const statusMatch = line.match(/STATUS:\s+(\d+)/);
    if (statusMatch) {
      entry.status = parseInt(statusMatch[1], 10);
    }

    // Extract response size
    const sizeMatch = line.match(/RESPONSE_SIZE:\s+([^\s]+)/);
    if (sizeMatch) {
      entry.responseSize = sizeMatch[1];
    }

    // Extract response time
    const timeMatch = line.match(/RESPONSE_TIME:\s+([\d.]+)\s+seconds/);
    if (timeMatch) {
      entry.responseTime = parseFloat(timeMatch[1]);
    }

    // Extract remote address
    const ipMatch = line.match(/REMOTE_ADDR:\s+([^\s]+)/);
    if (ipMatch) {
      entry.remoteAddr = ipMatch[1];
    }

    // Extract user agent
    const uaMatch = line.match(/USER_AGENT:\s+"([^"]+)"/);
    if (uaMatch) {
      entry.userAgent = uaMatch[1];
    }

    // Extract referer
    const refererMatch = line.match(/REFERER:\s+"([^"]+)"/);
    if (refererMatch) {
      entry.referer = refererMatch[1];
    }

    // Extract content type
    const ctMatch = line.match(/CONTENT_TYPE:\s+"([^"]+)"/);
    if (ctMatch) {
      entry.contentType = ctMatch[1];
    }

    // Extract request body
    const reqBodyIndex = line.indexOf('REQUEST_BODY: "');
    if (reqBodyIndex !== -1) {
      const start = reqBodyIndex + 'REQUEST_BODY: "'.length;
      // Find the closing quote (not escaped) before the next field or end
      let end = start;
      while (end < line.length) {
        if (line[end] === '"' && (end === start || line[end - 1] !== '\\')) {
          // Found unescaped closing quote
          break;
        }
        end++;
      }
      if (end < line.length) {
        entry.requestBody = line.substring(start, end)
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\\\/g, '\\');
      }
    }

    // Extract response body - find the content between RESPONSE_BODY: " and " ---
    const resBodyIndex = line.indexOf('RESPONSE_BODY: "');
    if (resBodyIndex !== -1) {
      const start = resBodyIndex + 'RESPONSE_BODY: "'.length;
      // Find the closing quote before " ---" (look for " ---" pattern)
      const endPattern = '" ---';
      const endIndex = line.indexOf(endPattern, start);
      if (endIndex !== -1) {
        const extracted = line.substring(start, endIndex)
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\\\/g, '\\');
        
        // Try to parse as JSON, if it fails keep as string
        try {
          entry.responseBody = JSON.parse(extracted);
        } catch {
          entry.responseBody = extracted;
        }
      } else {
        // Fallback: find the last quote before end of line
        let end = line.length - 1;
        while (end > start && line[end] !== '"') {
          end--;
        }
        if (end > start) {
          const extracted = line.substring(start, end)
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\');
          try {
            entry.responseBody = JSON.parse(extracted);
          } catch {
            entry.responseBody = extracted;
          }
        }
      }
    }

    return entry;
  }).filter(entry => entry.timestamp);
}

