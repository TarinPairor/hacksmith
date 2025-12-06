import { useState } from 'react'
import { DEFAULT_PATTERNS } from '../services/piiDetector'

export default function Settings({ patterns, onPatternsChange }) {
  // Initialize state from props once. If patterns need to be reset externally,
  // the parent component should use a key prop to remount this component
  const [localPatterns, setLocalPatterns] = useState(() => patterns || DEFAULT_PATTERNS)
  const [newPattern, setNewPattern] = useState({
    name: '',
    regex: '',
    color: '#4ecdc4',
    enabled: true,
  })

  const handlePatternToggle = (key) => {
    const updated = {
      ...localPatterns,
      [key]: {
        ...localPatterns[key],
        enabled: !localPatterns[key].enabled,
      },
    }
    setLocalPatterns(updated)
    onPatternsChange(updated)
  }

  const handlePatternUpdate = (key, field, value) => {
    const updated = {
      ...localPatterns,
      [key]: {
        ...localPatterns[key],
        [field]: value,
      },
    }
    setLocalPatterns(updated)
    onPatternsChange(updated)
  }

  const handleAddPattern = () => {
    if (!newPattern.name || !newPattern.regex) {
      alert('Please provide both name and regex pattern')
      return
    }

    try {
      // Validate regex
      new RegExp(newPattern.regex)
    } catch (e) {
      alert('Invalid regex pattern: ' + e.message)
      return
    }

    const key = newPattern.name.toLowerCase().replace(/\s+/g, '_')
    const updated = {
      ...localPatterns,
      [key]: {
        name: newPattern.name,
        regex: new RegExp(newPattern.regex, 'g'),
        color: newPattern.color,
        enabled: newPattern.enabled,
      },
    }
    setLocalPatterns(updated)
    onPatternsChange(updated)
    setNewPattern({ name: '', regex: '', color: '#4ecdc4', enabled: true })
  }

  const handleRemovePattern = (key) => {
    if (Object.keys(localPatterns).length <= 1) {
      alert('Cannot remove the last pattern')
      return
    }
    const updated = { ...localPatterns }
    delete updated[key]
    setLocalPatterns(updated)
    onPatternsChange(updated)
  }

  const handleReset = () => {
    if (confirm('Reset all patterns to defaults?')) {
      setLocalPatterns(DEFAULT_PATTERNS)
      onPatternsChange(DEFAULT_PATTERNS)
    }
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#4ecdc4' }}>Detection Settings</h1>
        <button className="button" onClick={handleReset}>Reset to Defaults</button>
      </div>

      <div className="card">
        <h2>Detection Patterns</h2>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>
          Configure regex patterns to detect PII, hashes, and sensitive data in logs
        </p>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {Object.entries(localPatterns).map(([key, pattern]) => (
            <div 
              key={key} 
              style={{ 
                padding: '1rem', 
                background: '#0a0a0a', 
                borderRadius: '4px',
                border: '1px solid #333'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={pattern.enabled}
                    onChange={() => handlePatternToggle(key)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <h3 style={{ color: '#4ecdc4', margin: 0 }}>{pattern.name}</h3>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      background: pattern.color,
                      borderRadius: '4px',
                      border: '1px solid #333',
                    }}
                  />
                </div>
                {key in DEFAULT_PATTERNS ? (
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>Default</span>
                ) : (
                  <button
                    className="button"
                    style={{ background: '#ff6b6b', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                    onClick={() => handleRemovePattern(key)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <label className="label">Regex Pattern</label>
                  <input
                    className="input"
                    type="text"
                    value={pattern.regex.source || pattern.regex.toString()}
                    onChange={(e) => {
                      try {
                        const regex = new RegExp(e.target.value, 'g')
                        handlePatternUpdate(key, 'regex', regex)
                      } catch {
                        // Invalid regex, don't update
                      }
                    }}
                    placeholder="/pattern/g"
                  />
                </div>
                <div>
                  <label className="label">Color</label>
                  <input
                    className="input"
                    type="color"
                    value={pattern.color}
                    onChange={(e) => handlePatternUpdate(key, 'color', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2>Add New Pattern</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label className="label">Pattern Name</label>
            <input
              className="input"
              type="text"
              value={newPattern.name}
              onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
              placeholder="e.g., Credit Card Number"
            />
          </div>
          <div>
            <label className="label">Regex Pattern</label>
            <input
              className="input"
              type="text"
              value={newPattern.regex}
              onChange={(e) => setNewPattern({ ...newPattern, regex: e.target.value })}
              placeholder="e.g., \\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b"
            />
            <small style={{ color: '#888', display: 'block', marginTop: '0.25rem' }}>
              Use JavaScript regex syntax. Flags (g, i) will be added automatically.
            </small>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label className="label">Color</label>
              <input
                className="input"
                type="color"
                value={newPattern.color}
                onChange={(e) => setNewPattern({ ...newPattern, color: e.target.value })}
              />
            </div>
            <button className="button" onClick={handleAddPattern}>
              Add Pattern
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2>Field Name Filters</h2>
        <p style={{ color: '#888', marginBottom: '1rem' }}>
          Suspicious field names that trigger detection (e.g., email, password, token)
        </p>
        <div style={{ 
          background: '#0a0a0a', 
          padding: '1rem', 
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          email, Email, EMail, password, Password, token, Token, secret, Secret, id, Id, ID, 
          userId, user_id, ssn, SSN, phone, Phone, creditCard, apiKey, accessToken
        </div>
        <p style={{ color: '#888', marginTop: '0.5rem', fontSize: '0.85rem' }}>
          These are hardcoded in the detection engine. Custom field detection coming soon.
        </p>
      </div>
    </div>
  )
}

