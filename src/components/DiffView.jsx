import React, { useLayoutEffect, useRef } from 'react'

// Words render as index-keyed spans so existing ones never remount: the
// word-in animation plays only on newly appended words as the stream grows.
function StreamingText({ text }) {
  const scrollRef = useRef(null)
  const words = text.match(/\S+\s*/g) ?? []

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // Follow the stream, but don't fight a user who scrolled up to re-read.
    // 60px covers the height a single flush can add before the threshold breaks.
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [text])

  return (
    <div ref={scrollRef} className="dv-suggested">
      {words.map((w, i) => (
        <span key={i} className="stream-word">{w}</span>
      ))}
    </div>
  )
}

export default function DiffView({ status, original, groupedOps, rejectedHunks, onToggleHunk, onDismiss, error, shortcut = '⌘ ⌥ G', streamingText = '' }) {
  if (status === 'idle') {
    return (
      <div className="dv-centered">
        <p className="dv-hint">Copy some text, then press <kbd className="kbd">{shortcut}</kbd></p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="dv-centered">
        <div className="dv-error-card">
          <p className="dv-error-title">
            <span className="status-dot offline" />
            Gus needs Ollama running
          </p>
          {error
            ? <p className="dv-error-body">{error}</p>
            : <p className="dv-error-body">Open Terminal and run:</p>
          }
          {!error && <code className="dv-code">ollama serve</code>}
          <button className="btn btn-ghost" style={{ alignSelf: 'flex-end', marginTop: 4 }} onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dv-split">
      <div>
        <div className="dv-label">Original</div>
        <div className="dv-original">{original}</div>
      </div>

      <div className="dv-divider" />

      <div className="dv-suggested-wrap">
        <div className="dv-label">Suggested</div>

        {status === 'loading' && streamingText ? (
          <StreamingText text={streamingText} />
        ) : status === 'loading' ? (
          <div className="skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        ) : (
          <div className="diff-result dv-suggested">
            {(groupedOps ?? []).map((item, idx) => {
              if (item.type === 'equal') {
                return <span key={`eq-${idx}`}>{item.text}</span>
              }

              const rejected = rejectedHunks.has(item.id)

              if (rejected) {
                return (
                  <span
                    key={item.id}
                    onClick={() => onToggleHunk(item.id)}
                    title={item.removes.length === 0 ? 'Click to re-add' : 'Click to re-accept'}
                    className="chip-rejected"
                  >
                    {item.removes.length === 0 ? item.adds.join('') : item.removes.join('')}
                  </span>
                )
              }

              if (item.adds.length === 0) {
                return (
                  <span
                    key={item.id}
                    onClick={() => onToggleHunk(item.id)}
                    title="Click to restore"
                    className="chip-del"
                  >
                    {item.removes.join('')}
                  </span>
                )
              }

              return (
                <span
                  key={item.id}
                  onClick={() => onToggleHunk(item.id)}
                  title="Click to reject"
                  className="chip-add"
                >
                  {item.adds.join('')}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
