import React, { useState, useEffect } from 'react'
import { btnBase } from '../styles/base'

const TAGS_URL = 'http://localhost:11434/api/tags'

export default function OllamaStatus() {
  const [status, setStatus] = useState('checking')
  const [model, setModel] = useState(null)
  const [checking, setChecking] = useState(false)

  async function check() {
    setChecking(true)
    setStatus('checking')
    try {
      const res = await fetch(TAGS_URL, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) throw new Error('bad status')
      const { models } = await res.json()
      setStatus('online')
      setModel(models?.[0]?.name ?? null)
    } catch {
      setStatus('offline')
      setModel(null)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => { check() }, [])

  const dotColor =
    status === 'online'   ? '#16a34a' :
    status === 'offline'  ? '#dc2626' : '#d1d5db'

  const statusLabel =
    status === 'checking' ? 'Checking…' :
    status === 'online'   ? 'Connected' : 'Not running'

  return (
    <div>
      <p style={styles.sectionLabel}>Ollama Status</p>
      <div style={styles.card}>
        <div style={styles.statusRow}>
          <span style={{ ...styles.dot, background: dotColor }} />
          <span style={styles.statusText}>{statusLabel}</span>
        </div>

        {status === 'online' && (
          <div style={styles.modelRow}>
            <span style={styles.metaLabel}>Model</span>
            <span style={styles.modelName}>{model ?? '—'}</span>
          </div>
        )}

        <button
          onClick={check}
          disabled={checking}
          style={{
            ...btnBase,
            ...styles.testBtn,
            ...(checking ? { color: '#bbb', cursor: 'not-allowed' } : {}),
          }}
          onMouseEnter={e => { if (!checking) e.currentTarget.style.background = '#f5f5f5' }}
          onMouseLeave={e => { if (!checking) e.currentTarget.style.background = 'transparent' }}
        >
          {checking ? 'Checking…' : 'Test connection'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  sectionLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#888',
    letterSpacing: '0.04em',
    marginBottom: 10,
  },
  card: {
    border: '1px solid #e8e8e8',
    borderRadius: 12,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 500,
    color: '#111',
    lineHeight: 1,
  },
  modelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTop: '0.5px solid #f0f0f0',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#aaa',
  },
  modelName: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  testBtn: {
    background: 'transparent',
    color: '#555',
    alignSelf: 'flex-start',
    padding: '5px 12px',
    border: '1px solid #e8e8e8',
    fontSize: 12,
  },
}
