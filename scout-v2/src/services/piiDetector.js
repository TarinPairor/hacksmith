/**
 * PII Detection Service
 * Detects PII, hashes, and sensitive data in log entries
 * Uses Shannon entropy and Base64 validation for better detection
 */

// Helper function to calculate Shannon entropy
function shannonEntropy(s) {
  if (!s || s.length === 0) {
    return 0.0;
  }
  
  const freq = {};
  for (const ch of s) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  
  let entropy = 0.0;
  const length = s.length;
  
  for (const count of Object.values(freq)) {
    const p = count / length;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

// Helper function to validate Base64
function isValidBase64(str) {
  // Base64 validation: must be valid Base64 characters and proper length
  if (!str || str.length < 4) return false;
  
  // Check if it matches Base64 pattern (already done by regex, but double-check)
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(str)) return false;
  
  // Base64 strings must have length that's a multiple of 4 (including padding)
  if (str.length % 4 !== 0) return false;
  
  // Padding can only be 0, 1, or 2 characters, and only at the end
  const padding = (str.match(/=/g) || []).length;
  if (padding > 2) return false;
  if (padding > 0 && !str.endsWith('='.repeat(padding))) return false;
  
  try {
    // Try to decode to validate - if it succeeds, it's valid Base64
    atob(str);
    return true;
  } catch {
    return false;
  }
}

// Base64 candidate pattern (matches Base64-like strings)
// Removed word boundaries to catch Base64 inside quotes or other contexts
const BASE64_CANDIDATE = /([A-Za-z0-9+/]{16,}={0,2})/g;

// Hash patterns
const HASH_PATTERNS = {
  md5: /\b[a-fA-F0-9]{32}\b/g,
  sha1: /\b[a-fA-F0-9]{40}\b/g,
  sha256: /\b[a-fA-F0-9]{64}\b/g,
  sha512: /\b[a-fA-F0-9]{128}\b/g,
};

// Secret/token patterns
const SECRET_PATTERNS = {
  jwt: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  api_token: /\b(token|Token|TOKEN|api[_-]?key|API[_-]?KEY|secret|Secret|SECRET)[\s:=]+([A-Za-z0-9_-]{20,})/gi,
};

// High-entropy token candidate (alphanumeric + some special chars, 20+ chars)
const CANDIDATE_TOKEN = /\b[A-Za-z0-9_-]{20,}\b/g;

export const DEFAULT_PATTERNS = {
  email: {
    name: 'Email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    color: '#ff6b6b',
    enabled: true,
  },
  phone: {
    name: 'Phone Number',
    regex: /\b\d{10,}\b/g, // 10+ consecutive digits
    color: '#4ecdc4',
    enabled: true,
  },
  ssn: {
    name: 'SSN',
    regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    color: '#ffe66d',
    enabled: true,
  },
  md5: {
    name: 'MD5 Hash',
    regex: /\b[a-fA-F0-9]{32}\b/g,
    color: '#95e1d3',
    enabled: true,
  },
  sha1: {
    name: 'SHA1 Hash',
    regex: /\b[a-fA-F0-9]{40}\b/g,
    color: '#95e1d3',
    enabled: true,
  },
  sha256: {
    name: 'SHA256 Hash',
    regex: /\b[a-fA-F0-9]{64}\b/g,
    color: '#95e1d3',
    enabled: true,
  },
  token: {
    name: 'API Token',
    regex: /\b(token|Token|TOKEN|api[-_]?key|API[-_]?KEY|secret|Secret|SECRET)[\s:=]+([A-Za-z0-9_-]{20,})/gi,
    color: '#ff9ff3',
    enabled: true,
  },
  jwt: {
    name: 'JWT Token',
    regex: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    color: '#a8e6cf',
    enabled: true,
  },
  base64: {
    name: 'Base64 Encoded Data',
    regex: BASE64_CANDIDATE,
    color: '#ff8787',
    enabled: true,
    validate: isValidBase64, // Custom validation function
  },
  high_entropy: {
    name: 'High Entropy Token',
    regex: CANDIDATE_TOKEN,
    color: '#ff6b9d',
    enabled: true,
    minEntropy: 3.5, // Minimum entropy threshold
  },
};

export const SUSPICIOUS_FIELDS = [
  'email', 'Email', 'EMail', 'e-mail', 'E-mail',
  'password', 'Password', 'PASSWORD', 'passwd',
  'id', 'Id', 'ID', 'userId', 'user_id', 'userID',
  'token', 'Token', 'TOKEN', 'accessToken', 'access_token',
  'secret', 'Secret', 'SECRET', 'apiKey', 'api_key', 'API_KEY',
  'ssn', 'SSN', 'social', 'socialSecurity',
  'phone', 'Phone', 'PHONE', 'mobile', 'Mobile',
  'creditCard', 'credit_card', 'cardNumber',
  'address', 'Address', 'street', 'Street',
];

export function detectPII(text, patterns = DEFAULT_PATTERNS) {
  if (!text) return [];
  if (!patterns || typeof patterns !== 'object') {
    patterns = DEFAULT_PATTERNS;
  }

  const detections = [];
  const textStr = typeof text === 'string' ? text : JSON.stringify(text);

  // 1. Detect Base64 (with validation)
  if (patterns.base64?.enabled) {
    // Reset regex lastIndex to ensure fresh matching
    BASE64_CANDIDATE.lastIndex = 0;
    const matches = [...textStr.matchAll(BASE64_CANDIDATE)];
    matches.forEach(match => {
      if (match.index !== undefined && match[1]) {
        const b64 = match[1];
        // Validate Base64 - must be at least 16 chars and valid Base64
        if (b64.length >= 16 && isValidBase64(b64)) {
          // Debug: log when we find a valid Base64 string
          if (b64.includes('c3VzcGljaW91c19jb21tYW5kX3BheWxvYWQ=')) {
            console.log('Found Base64 match:', b64, 'at index', match.index);
          }
          // Skip if already detected as a hash (hashes are more specific)
          const alreadyDetectedAsHash = detections.some(d => 
            d.pattern && ['md5', 'sha1', 'sha256', 'sha512'].includes(d.pattern) &&
            d.start <= match.index && d.end >= match.index + b64.length
          );
          
          if (!alreadyDetectedAsHash) {
            try {
              // Try to decode to get preview
              const decoded = atob(b64);
              const preview = decoded.length > 50 ? decoded.substring(0, 50) + '...' : decoded;
              detections.push({
                type: 'Base64 Encoded Data',
                value: b64,
                start: match.index,
                end: match.index + b64.length,
                color: patterns.base64.color || '#ff8787',
                pattern: 'base64',
                preview: preview,
              });
            } catch {
              // Valid Base64 but decode failed, still flag it
              detections.push({
                type: 'Base64 Encoded Data',
                value: b64,
                start: match.index,
                end: match.index + b64.length,
                color: patterns.base64.color || '#ff8787',
                pattern: 'base64',
              });
            }
          }
        }
      }
    });
  }

  // 2. Detect hashes
  Object.entries(HASH_PATTERNS).forEach(([algo, regex]) => {
    const matches = [...textStr.matchAll(regex)];
    matches.forEach(match => {
      if (match.index !== undefined) {
        detections.push({
          type: `${algo.toUpperCase()} Hash`,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          color: '#95e1d3',
          pattern: algo,
        });
      }
    });
  });

  // 3. Detect known tokens/secrets
  Object.entries(SECRET_PATTERNS).forEach(([name, regex]) => {
    const matches = [...textStr.matchAll(regex)];
    matches.forEach(match => {
      if (match.index !== undefined) {
        detections.push({
          type: name === 'jwt' ? 'JWT Token' : 'API Token/Secret',
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          color: name === 'jwt' ? '#a8e6cf' : '#ff9ff3',
          pattern: name,
        });
      }
    });
  });

  // 4. Detect high-entropy tokens
  if (patterns.high_entropy?.enabled) {
    const minEntropy = patterns.high_entropy.minEntropy || 3.5;
    const matches = [...textStr.matchAll(CANDIDATE_TOKEN)];
    matches.forEach(match => {
      if (match.index !== undefined) {
        const token = match[0];
        const entropy = shannonEntropy(token);
        
        // Only flag if entropy is high enough
        if (entropy >= minEntropy) {
          // Skip if it's already detected as something else
          const alreadyDetected = detections.some(d => 
            d.start <= match.index && d.end >= match.index + token.length
          );
          
          if (!alreadyDetected) {
            detections.push({
              type: 'High Entropy Token',
              value: token,
              start: match.index,
              end: match.index + token.length,
              color: patterns.high_entropy.color || '#ff6b9d',
              pattern: 'high_entropy',
              entropy: entropy.toFixed(2),
            });
          }
        }
      }
    });
  }

  // 5. Check standard patterns (email, phone, SSN)
  Object.entries(patterns).forEach(([key, pattern]) => {
    // Skip patterns we've already handled
    if (key === 'base64' || key === 'high_entropy' || !pattern || !pattern.enabled) return;
    if (!pattern.regex) return;

    // Handle regex - could be RegExp object or string
    let regex = pattern.regex;
    if (typeof regex === 'string') {
      try {
        regex = new RegExp(regex, 'g');
      } catch (e) {
        console.warn(`Invalid regex for pattern ${key}:`, e);
        return;
      }
    } else if (regex instanceof RegExp) {
      // Clone to avoid mutating the original
      regex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
    } else {
      return;
    }

    try {
      const matches = [...textStr.matchAll(regex)];
      matches.forEach(match => {
        if (match.index !== undefined) {
          // Skip if already detected
          const alreadyDetected = detections.some(d => 
            d.start <= match.index && d.end >= match.index + match[0].length
          );
          
          if (!alreadyDetected) {
            detections.push({
              type: pattern.name || key,
              value: match[0],
              start: match.index,
              end: match.index + match[0].length,
              color: pattern.color || '#ff6b6b',
              pattern: key,
            });
          }
        }
      });
    } catch (e) {
      console.warn(`Error matching pattern ${key}:`, e);
    }
  });

  // Check for suspicious field names in JSON
  try {
    const json = JSON.parse(textStr);
    const jsonStr = JSON.stringify(json, null, 2);
    
    SUSPICIOUS_FIELDS.forEach(field => {
      const fieldRegex = new RegExp(`"${field}"\\s*:`, 'gi');
      const matches = [...jsonStr.matchAll(fieldRegex)];
      matches.forEach(match => {
        // Find the value after the colon
        const afterColon = jsonStr.substring(match.index + match[0].length);
        const valueMatch = afterColon.match(/^\s*"([^"]+)"|^\s*(\d+)|^\s*(\{[^}]*\})/);
        if (valueMatch) {
          const value = valueMatch[1] || valueMatch[2] || valueMatch[3];
          detections.push({
            type: `Suspicious Field: ${field}`,
            value: value,
            start: match.index,
            end: match.index + match[0].length + (valueMatch[0]?.length || 0),
            color: '#ffd93d',
            pattern: 'suspicious_field',
            field: field,
          });
        }
      });
    });
  } catch (e) {
    // Not JSON, skip field detection
    console.error(e)
  }

  // Sort by position
  detections.sort((a, b) => a.start - b.start);

  return detections;
}

export function analyzeLogEntry(logEntry, patterns = DEFAULT_PATTERNS) {
  const detections = [];
  const fields = ['requestBody', 'responseBody', 'url', 'userAgent'];

  fields.forEach(field => {
    if (logEntry[field]) {
      // Convert to string consistently (formatted JSON for objects)
      let fieldValue = logEntry[field];
      if (typeof fieldValue === 'object') {
        fieldValue = JSON.stringify(fieldValue, null, 2);
      } else {
        fieldValue = String(fieldValue);
      }
      
      // Store the stringified version for consistent detection/display
      if (typeof logEntry[field] === 'object') {
        logEntry[`${field}_string`] = fieldValue;
      }
      
      const found = detectPII(fieldValue, patterns);
      found.forEach(detection => {
        detections.push({
          ...detection,
          field: field,
          logEntry: logEntry,
        });
      });
    }
  });

  return {
    logEntry,
    detections,
    hasPII: detections.length > 0,
    detectionCount: detections.length,
    detectionTypes: [...new Set(detections.map(d => d.type))],
  };
}

export function analyzeLogs(logEntries, patterns = DEFAULT_PATTERNS) {
  return logEntries.map(entry => analyzeLogEntry(entry, patterns));
}

