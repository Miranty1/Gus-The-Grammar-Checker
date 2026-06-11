import React, { useState, useEffect, useRef } from 'react'
import { btnBase } from '../styles/base'

const TAGS_URL = 'http://localhost:11434/api/tags'

export default function OllamaStatus() {
  const [status, setStatus] = useState('checking')
  const [model, setModel] = useState(null)
  const [modelCount, setModelCount] = useState(0)
  const [checking, setChecking] = useState(false)
  const abortRef = useRef(null)

  async function check() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setChecking(true)
    setStatus('checking')
    try {
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(5000)])
      const res = await fetch(TAGS_URL, { signal })
      if (!res.ok) throw new Error('bad status')
      const { models } = await res.json()
      if (controller.signal.aborted) return
      setStatus('online')
      setModel(models?.[0]?.name ?? null)
      setModelCount(models?.length ?? 0)
    } catch {
      if (controller.signal.aborted) return
      setStatus('offline')
      setModel(null)
      setModelCount(0)
    } finally {
      if (!controller.signal.aborted) setChecking(false)
    }
  }

  useEffect(() => {
    check()
    return () => abortRef.current?.abort()
  }, [])

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
            {modelCount > 1 && (
              <span style={styles.modelBadge}>+{modelCount - 1} more</span>
            )}
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
  modelBadge: {
    fontSize: 10,
    color: '#888',
    background: '#f0f0f0',
    border: '1px solid #e0e0e0',
    borderRadius: 10,
    padding: '1px 6px',
    marginLeft: 4,
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
