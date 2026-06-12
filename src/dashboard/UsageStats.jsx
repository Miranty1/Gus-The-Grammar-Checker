import React, { useState, useEffect } from 'react'

const MODE_LABELS = {
  grammar: 'Spell & grammar',
  refinement: 'Refinement',
  tone: 'Tone shift',
  concise: 'Concise',
}

const TILES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'mode', label: 'Most used mode' },
]

function toLocalDateString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function computeStats(usage) {
  const today = toLocalDateString()

  const checksToday = Object.values(usage[today] ?? {}).reduce((s, n) => s + n, 0)

  const weekKeys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return toLocalDateString(d)
  })
  const checksThisWeek = weekKeys.reduce((s, k) => {
    return s + Object.values(usage[k] ?? {}).reduce((ss, n) => ss + n, 0)
  }, 0)

  const totals = {}
  for (const dayData of Object.values(usage)) {
    for (const [m, n] of Object.entries(dayData)) {
      totals[m] = (totals[m] || 0) + n
    }
  }
  const topMode = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return { checksToday, checksThisWeek, topMode }
}

export default function UsageStats() {
  const [stats, setStats] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    window.electronAPI.invoke('load-usage')
      .then(data => setStats(computeStats(data ?? {})))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  const values = {
    today: stats?.checksToday ?? '—',
    week: stats?.checksThisWeek ?? '—',
    mode: stats?.topMode ? (MODE_LABELS[stats.topMode] ?? stats.topMode) : '—',
  }

  if (loading) {
    return (
      <div>
        <p className="section-label">Usage</p>
        <p className="hint">Loading…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div>
        <p className="section-label">Usage</p>
        <p className="error-text">Could not load usage data.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="section-label">Usage</p>
      <div className="stat-grid">
        {TILES.map(tile => (
          <div key={tile.id} className="stat-tile">
            <span className="stat-label">{tile.label}</span>
            <span className={`stat-value${tile.id === 'mode' ? ' small' : ''}`}>
              {values[tile.id]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
