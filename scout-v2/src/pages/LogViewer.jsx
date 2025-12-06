import { useState, useMemo } from 'react'

function HighlightedText({ text, detections }) {
  if (!text || !detections || detections.length === 0) {
    return <span>{text}</span>
  }

  // Filter out overlapping detections (keep the first one if they overlap)
  const sortedDetections = [...detections].sort((a, b) => a.start - b.start)
  const nonOverlapping = []
  let lastEnd = 0

  sortedDetections.forEach(detection => {
    // Only add if it doesn't overlap with previous detection
    if (detection.start >= lastEnd) {
      nonOverlapping.push(detection)
      lastEnd = Math.max(lastEnd, detection.end)
    }
  })

  const parts = []
  let lastIndex = 0

  nonOverlapping.forEach((detection, index) => {
    // Ensure positions are within text bounds
    const start = Math.max(0, Math.min(detection.start, text.length))
    const end = Math.max(start, Math.min(detection.end, text.length))

    // Add text before detection
    if (start > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {text.substring(lastIndex, start)}
        </span>
      )
    }

    // Extract the actual text from the original string (not detection.value)
    const detectedText = text.substring(start, end)
    
    // Add highlighted detection using the extracted text
    parts.push(
      <span
        key={`detection-${index}`}
        style={{
          background: detection.color,
          color: '#000',
          padding: '2px 4px',
          borderRadius: '3px',
          fontWeight: 'bold',
          position: 'relative',
        }}
        title={detection.type}
      >
        {detectedText}
      </span>
    )

    lastIndex = end
  })

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end">
        {text.substring(lastIndex)}
      </span>
    )
  }

  return <span>{parts}</span>
}

function LogEntryCard({ analyzedLog }) {
  const [expanded, setExpanded] = useState(false)
  const { logEntry, detections } = analyzedLog

  // Get the actual text strings for each field (for consistent detection positions)
  const getFieldText = (field) => {
    const stringField = `${field}_string`
    if (logEntry[stringField]) {
      return logEntry[stringField]
    }
    const value = logEntry[field]
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value || '')
  }

  // Get detections for each field and recalculate positions if needed
  const requestBodyText = logEntry.requestBody ? getFieldText('requestBody') : ''
  const responseBodyText = logEntry.responseBody ? getFieldText('responseBody') : ''
  const urlText = logEntry.url ? getFieldText('url') : ''

  // Filter detections by field
  const requestBodyDetections = detections.filter(d => d.field === 'requestBody')
  const responseBodyDetections = detections.filter(d => d.field === 'responseBody')
  const urlDetections = detections.filter(d => d.field === 'url')

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <code style={{ color: '#4ecdc4', fontSize: '1.1rem' }}>
              {logEntry.method} {logEntry.url}
            </code>
            <span style={{ 
              background: detections.length > 0 ? '#ff6b6b' : '#4ecdc4',
              padding: '0.25rem 0.5rem',
              borderRadius: '3px',
              fontSize: '0.85rem',
              fontWeight: 'bold'
            }}>
              {detections.length} detection{detections.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ color: '#888', fontSize: '0.9rem' }}>
            {logEntry.timestamp} • Status: {logEntry.status} • {logEntry.responseTime}s
          </div>
        </div>
        <button 
          className="button"
          style={{ background: 'transparent', color: '#4ecdc4', border: '1px solid #4ecdc4' }}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #333' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>Detection Types:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[...new Set(detections.map(d => d.type))].map((type, i) => {
                const detection = detections.find(d => d.type === type)
                return (
                  <span
                    key={i}
                    style={{
                      background: detection.color,
                      color: '#000',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '3px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {type}
                  </span>
                )
              })}
            </div>
          </div>

          {logEntry.url && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>URL:</h4>
              <div style={{ 
                background: '#0a0a0a', 
                padding: '1rem', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                overflowX: 'auto'
              }}>
                <HighlightedText text={urlText} detections={urlDetections} />
              </div>
            </div>
          )}

          {logEntry.requestBody && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>Request Body:</h4>
              <div style={{ 
                background: '#0a0a0a', 
                padding: '1rem', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                <HighlightedText text={requestBodyText} detections={requestBodyDetections} />
              </div>
            </div>
          )}

          {logEntry.responseBody && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>Response Body:</h4>
              <div style={{ 
                background: '#0a0a0a', 
                padding: '1rem', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                <HighlightedText text={responseBodyText} detections={responseBodyDetections} />
              </div>
            </div>
          )}

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #333' }}>
            <h4 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>Raw Log:</h4>
            <pre style={{ 
              background: '#0a0a0a', 
              padding: '1rem', 
              borderRadius: '4px',
              fontSize: '0.85rem',
              overflowX: 'auto'
            }}>
              {logEntry.raw}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LogViewer({ analyzedLogs, loading }) {
  const [limit, setLimit] = useState(10)
  const [filter, setFilter] = useState('all') // all, flagged, unflagged

  const flaggedLogs = useMemo(() => {
    const filtered = analyzedLogs.filter(log => {
      if (filter === 'flagged') return log.hasPII
      if (filter === 'unflagged') return !log.hasPII
      return true
    })
    return filtered.slice(0, limit)
  }, [analyzedLogs, filter, limit])

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <h2>Loading logs...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#4ecdc4' }}>Log Viewer</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            className="input" 
            style={{ width: 'auto' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Logs</option>
            <option value="flagged">Flagged Only</option>
            <option value="unflagged">Unflagged Only</option>
          </select>
          <select 
            className="input" 
            style={{ width: 'auto' }}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={10}>10 logs</option>
            <option value={25}>25 logs</option>
            <option value={50}>50 logs</option>
            <option value={100}>100 logs</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', color: '#888' }}>
        Showing {flaggedLogs.length} of {analyzedLogs.length} logs
        {filter === 'flagged' && ` (${analyzedLogs.filter(l => l.hasPII).length} flagged)`}
      </div>

      {flaggedLogs.length === 0 ? (
        <div className="card">
          <p style={{ color: '#888' }}>No logs to display</p>
        </div>
      ) : (
        flaggedLogs.map((analyzedLog, index) => (
          <LogEntryCard 
            key={index} 
            analyzedLog={analyzedLog}
          />
        ))
      )}
    </div>
  )
}

