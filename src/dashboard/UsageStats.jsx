import React, { useState, useEffect } from 'react'

const MODE_LABELS = {
  grammar: 'Spell & grammar',
  refinement: 'Refinement',
  tone: 'Tone shift',
  concise: 'Concise',
}

const CARDS = [
  {
    id: 'today',
    label: 'Today',
    bg: '#E6F1FB', text: '#0C447C', border: '#B5D4F4',
  },
  {
    id: 'week',
    label: 'This week',
    bg: '#EEEDFE', text: '#3C3489', border: '#CECBF6',
  },
  {
    id: 'mode',
    label: 'Most used mode',
    bg: '#E1F5EE', text: '#085041', border: '#9FE1CB',
  },
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
        <p style={styles.sectionLabel}>Usage</p>
        <p style={styles.loadingText}>Loading…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div>
        <p style={styles.sectionLabel}>Usage</p>
        <p style={styles.errorText}>Could not load usage data.</p>
      </div>
    )
  }

  return (
    <div>
      <p style={styles.sectionLabel}>Usage</p>
      <div style={styles.grid}>
        {CARDS.map(card => (
          <div
            key={card.id}
            style={{
              ...styles.card,
              background: card.bg,
              border: `1px solid ${card.border}`,
              color: card.text,
            }}
          >
            <span style={styles.cardLabel}>{card.label}</span>
            <span style={{
              ...styles.cardValue,
              fontSize: card.id === 'mode' ? 18 : 32,
            }}>
              {values[card.id]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  loadingText: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#888',
    letterSpacing: '0.04em',
    marginBottom: 10,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  card: {
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  cardValue: {
    fontWeight: 700,
    lineHeight: 1.1,
  },
}
