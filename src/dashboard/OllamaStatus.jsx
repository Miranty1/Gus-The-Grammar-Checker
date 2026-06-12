import React, { useState, useEffect, useRef } from 'react'

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

  const dotClass =
    status === 'online'  ? 'status-dot online' :
    status === 'offline' ? 'status-dot offline' : 'status-dot'

  const statusLabel =
    status === 'checking' ? 'Checking…' :
    status === 'online'   ? 'Connected' : 'Not running'

  return (
    <div>
      <p className="section-label">Ollama Status</p>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={dotClass} />
          <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>{statusLabel}</span>
        </div>

        {status === 'online' && (
          <div style={styles.modelRow}>
            <span className="hint">Model</span>
            <span style={styles.modelName}>{model ?? '—'}</span>
            {modelCount > 1 && (
              <span style={styles.modelBadge}>+{modelCount - 1} more</span>
            )}
          </div>
        )}

        <button className="btn-outline" style={{ alignSelf: 'flex-start' }} onClick={check} disabled={checking}>
          {checking ? 'Checking…' : 'Test connection'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  modelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTop: '1px solid var(--hairline)',
  },
  modelName: {
    fontSize: 12,
    color: 'var(--ink)',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  modelBadge: {
    fontSize: 10,
    color: 'var(--ink-3)',
    background: 'var(--bg-inset)',
    borderRadius: 10,
    padding: '2px 7px',
    marginLeft: 4,
  },
}
