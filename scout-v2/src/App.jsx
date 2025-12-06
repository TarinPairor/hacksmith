import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import LogViewer from './pages/LogViewer'
import Settings from './pages/Settings'
import { parseLogContent } from './services/logService'
import { analyzeLogs, DEFAULT_PATTERNS } from './services/piiDetector'
import './App.css'

function Navigation() {
  const location = useLocation()
  
  return (
    <nav style={{ 
      background: '#1a1a1a', 
      padding: '1rem',
      display: 'flex',
      gap: '2rem',
      borderBottom: '1px solid #333'
    }}>
      <Link 
        to="/" 
        style={{ 
          color: location.pathname === '/' ? '#4ecdc4' : '#ccc',
          textDecoration: 'none',
          fontWeight: location.pathname === '/' ? 'bold' : 'normal'
        }}
      >
        Analytics
      </Link>
      <Link 
        to="/logs" 
        style={{ 
          color: location.pathname === '/logs' ? '#4ecdc4' : '#ccc',
          textDecoration: 'none',
          fontWeight: location.pathname === '/logs' ? 'bold' : 'normal'
        }}
      >
        Log Viewer
      </Link>
      <Link 
        to="/settings" 
        style={{ 
          color: location.pathname === '/settings' ? '#4ecdc4' : '#ccc',
          textDecoration: 'none',
          fontWeight: location.pathname === '/settings' ? 'bold' : 'normal'
        }}
      >
        Settings
      </Link>
    </nav>
  )
}

function App() {
  const [logs, setLogs] = useState([])
  const [analyzedLogs, setAnalyzedLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [patterns, setPatterns] = useState(() => {
    const saved = localStorage.getItem('detectionPatterns')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Convert regex strings back to RegExp objects
        Object.keys(parsed).forEach(key => {
          if (parsed[key].regex && typeof parsed[key].regex === 'string') {
            try {
              parsed[key].regex = new RegExp(parsed[key].regex, 'g')
            } catch (e) {
              console.error(e)
              console.warn(`Invalid regex for ${key}, using default`)
            }
          }
        })
        // Merge with DEFAULT_PATTERNS to ensure all defaults are present
        // This ensures base64 and other default patterns are always available
        const merged = { ...DEFAULT_PATTERNS, ...parsed }
        // Restore special properties that can't be serialized (like validate function)
        // Also ensure default patterns use their default regex if they exist in DEFAULT_PATTERNS
        Object.keys(DEFAULT_PATTERNS).forEach(key => {
          if (merged[key] && DEFAULT_PATTERNS[key]) {
            // Restore validate function if it exists in default
            if (DEFAULT_PATTERNS[key].validate && !merged[key].validate) {
              merged[key].validate = DEFAULT_PATTERNS[key].validate
            }
            // Restore default regex if the pattern is a default one
            // This ensures BASE64_CANDIDATE and other constants are used correctly
            if (DEFAULT_PATTERNS[key].regex instanceof RegExp) {
              merged[key].regex = DEFAULT_PATTERNS[key].regex
            }
          }
        })
        return merged
      } catch (e) {
        console.error(e)
        return null
      }
    }
    return null
  })

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    if (logs.length > 0) {
      const patternsToUse = patterns || DEFAULT_PATTERNS
      const analyzed = analyzeLogs(logs, patternsToUse)
      setAnalyzedLogs(analyzed)
    } else {
      setAnalyzedLogs([])
    }
  }, [logs, patterns])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/logs')
      if (response.ok) {
        const text = await response.text()
        const parsed = parseLogContent(text)
        setLogs(parsed)
      } else {
        console.warn('Could not load logs from API')
        setLogs([])
      }
    } catch (error) {
      console.error('Error loading logs:', error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const handlePatternsChange = (newPatterns) => {
    setPatterns(newPatterns)
    // Convert RegExp to string for storage
    const toStore = { ...newPatterns }
    Object.keys(toStore).forEach(key => {
      if (toStore[key].regex instanceof RegExp) {
        toStore[key].regex = toStore[key].regex.source
      }
    })
    localStorage.setItem('detectionPatterns', JSON.stringify(toStore))
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
        <Navigation />
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                analyzedLogs={analyzedLogs} 
                loading={loading}
                onRefresh={loadLogs}
              />
            } 
          />
          <Route 
            path="/logs" 
            element={
              <LogViewer 
                analyzedLogs={analyzedLogs}
                loading={loading}
              />
            } 
          />
          <Route 
            path="/settings" 
            element={
              <Settings 
                patterns={patterns || DEFAULT_PATTERNS}
                onPatternsChange={handlePatternsChange}
              />
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
