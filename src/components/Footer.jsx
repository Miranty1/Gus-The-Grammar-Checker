import React, { useState, useEffect, useRef } from 'react'

const TAGS_URL = 'http://localhost:11434/api/tags'

// Re-checks whenever generation status changes, so the dot flips red as soon
// as a run fails and back to green once Ollama is reachable again.
function OllamaBadge({ status }) {
  const [state, setState] = useState({ online: null, model: null })
  const abortRef = useRef(null)

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(5000)])

    fetch(TAGS_URL, { signal })
      .then(res => {
        if (!res.ok) throw new Error('bad status')
        return res.json()
      })
      .then(({ models }) => {
        if (controller.signal.aborted) return
        setState({ online: true, model: models?.[0]?.name ?? null })
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setState({ online: false, model: null })
      })

    return () => controller.abort()
  }, [status])

  if (state.online === null) return <div className="status-badge" />

  return (
    <div className="status-badge">
      <span className={`status-dot ${state.online ? 'online' : 'offline'}`} />
      <span className="status-model">
        {state.online ? (state.model ?? 'Ollama') : 'Ollama offline'}
      </span>
    </div>
  )
}

export default function Footer({ onAccept, onDismiss, disabled, status }) {
  return (
    <div className="footer">
      <OllamaBadge status={status} />
      <button className="btn btn-ghost" onClick={onDismiss}>
        Dismiss <span className="keycap">⎋</span>
      </button>
      <button
        className="btn btn-primary"
        onClick={disabled ? undefined : onAccept}
        disabled={disabled}
      >
        Accept <span className="keycap">⏎</span>
      </button>
    </div>
  )
}
