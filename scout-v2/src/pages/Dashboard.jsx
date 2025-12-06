import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function Dashboard({ analyzedLogs, loading, onRefresh }) {
  const [limit, setLimit] = useState(10)

  const flaggedLogs = useMemo(() => {
    return analyzedLogs.filter(log => log.hasPII)
  }, [analyzedLogs])

  const endpointStats = useMemo(() => {
    const stats = {}
    flaggedLogs.forEach(log => {
      const endpoint = log.logEntry.endpoint || 'Unknown'
      if (!stats[endpoint]) {
        stats[endpoint] = { count: 0, types: new Set() }
      }
      stats[endpoint].count++
      log.detectionTypes.forEach(type => stats[endpoint].types.add(type))
    })
    return Object.entries(stats)
      .map(([endpoint, data]) => ({
        endpoint,
        count: data.count,
        types: Array.from(data.types),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }, [flaggedLogs, limit])

  const piiTypeStats = useMemo(() => {
    const stats = {}
    flaggedLogs.forEach(log => {
      log.detections.forEach(detection => {
        const type = detection.type
        stats[type] = (stats[type] || 0) + 1
      })
    })
    return Object.entries(stats)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }, [flaggedLogs, limit])

  const timeSeriesData = useMemo(() => {
    const timeMap = {}
    flaggedLogs.forEach(log => {
      if (log.logEntry.timestamp) {
        const date = new Date(log.logEntry.timestamp).toISOString().split('T')[0]
        timeMap[date] = (timeMap[date] || 0) + 1
      }
    })
    return Object.entries(timeMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-limit)
  }, [flaggedLogs, limit])

  const COLORS = ['#4ecdc4', '#ff6b6b', '#ffe66d', '#95e1d3', '#ff9ff3', '#a8e6cf', '#ffd93d']

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
        <h1 style={{ color: '#4ecdc4' }}>Analytics Dashboard</h1>
        <button className="button" onClick={onRefresh}>Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Logs</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ecdc4' }}>
            {analyzedLogs.length}
          </div>
        </div>
        <div className="card">
          <h3 style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Flagged Logs</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b' }}>
            {flaggedLogs.length}
          </div>
        </div>
        <div className="card">
          <h3 style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Detection Rate</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffe66d' }}>
            {analyzedLogs.length > 0 
              ? ((flaggedLogs.length / analyzedLogs.length) * 100).toFixed(1) 
              : 0}%
          </div>
        </div>
        <div className="card">
          <h3 style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Detections</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#95e1d3' }}>
            {flaggedLogs.reduce((sum, log) => sum + log.detectionCount, 0)}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Most Flagged Endpoints</h2>
          <select 
            className="input" 
            style={{ width: 'auto', marginLeft: '1rem' }}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={endpointStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="endpoint" stroke="#ccc" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#ccc" />
            <Tooltip 
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
            />
            <Legend />
            <Bar dataKey="count" fill="#4ecdc4" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h2>PII Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={piiTypeStats}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ type, count }) => `${type}: ${count}`}
              >
                {piiTypeStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Flagged Logs Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip 
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
              />
              <Line type="monotone" dataKey="count" stroke="#4ecdc4" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2>Top Flagged Endpoints Details</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#4ecdc4' }}>Endpoint</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#4ecdc4' }}>Flag Count</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#4ecdc4' }}>Detection Types</th>
              </tr>
            </thead>
            <tbody>
              {endpointStats.map((stat, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <code>{stat.endpoint}</code>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{stat.count}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {stat.types.map((type, i) => (
                      <span 
                        key={i}
                        style={{
                          background: '#2a2a2a',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '3px',
                          marginRight: '0.5rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        {type}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

