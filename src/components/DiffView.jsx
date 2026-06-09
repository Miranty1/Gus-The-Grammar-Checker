import React, { useState } from 'react'

export default function DiffView({ status, original, groupedOps, rejectedHunks, onToggleHunk, onDismiss, error }) {
  if (status === 'idle') {
    return (
      <div style={styles.centered}>
        <p style={styles.muted}>Copy some text, then press <kbd style={styles.kbd}>⌘ ⌥ G</kbd></p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={styles.centered}>
        <div style={styles.errorCard}>
          <p style={styles.errorHeading}>Gus needs Ollama running</p>
          <p style={styles.errorBody}>Open Terminal and run:</p>
          <code style={styles.codeBlock}>ollama serve</code>
          <DismissButton onClick={onDismiss} />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.splitWrap}>
      <div style={styles.section}>
        <div style={styles.sectionLabel}>ORIGINAL</div>
        <div style={styles.originalText}>{original}</div>
      </div>

      <div style={styles.divider} />

      <div style={{ ...styles.section, flex: 1, minHeight: 0 }}>
        <div style={styles.sectionLabel}>SUGGESTED</div>

        {status === 'loading' ? (
          <div style={styles.dotsWrap}>
            <div style={styles.loadingDots}>
              <span style={{ ...styles.dot, animationDelay: '0ms' }} />
              <span style={{ ...styles.dot, animationDelay: '160ms' }} />
              <span style={{ ...styles.dot, animationDelay: '320ms' }} />
            </div>
          </div>
        ) : (
          <div style={styles.suggestedText}>
            {groupedOps.map((item, idx) => {
              if (item.type === 'equal') {
                return <span key={idx}>{item.text}</span>
              }

              const rejected = rejectedHunks.has(item.id)

              if (rejected) {
                if (item.removes.length === 0) return null
                return (
                  <span
                    key={item.id}
                    onClick={() => onToggleHunk(item.id)}
                    title="Click to re-accept"
                    style={styles.rejectedChip}
                  >
                    {item.removes.join('')}
                  </span>
                )
              }

              if (item.adds.length === 0) {
                return (
                  <span
                    key={item.id}
                    onClick={() => onToggleHunk(item.id)}
                    title="Click to restore"
                    style={styles.deletionMarker}
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
                  style={styles.addedChip}
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

function DismissButton({ onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.dismissBtn,
        background: hovered ? '#f5f5f5' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      Dismiss
    </button>
  )
}

const styles = {
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '0 20px',
  },
  muted: {
    fontSize: 13,
    color: '#888',
    margin: 0,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  kbd: {
    display: 'inline-block',
    padding: '1px 6px',
    background: '#f0f0f0',
    border: '1px solid #ddd',
    borderRadius: 5,
    fontSize: 11,
    fontFamily: '-apple-system, sans-serif',
    color: '#555',
  },
  errorCard: {
    background: '#fef2f2',
    border: '1px solid #fde8e8',
    borderRadius: 12,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
    maxWidth: 380,
  },
  errorHeading: {
    margin: 0,
    fontSize: 15,
    fontWeight: 500,
    color: '#111',
    lineHeight: 1.3,
  },
  errorBody: {
    margin: 0,
    fontSize: 13,
    color: '#666',
    lineHeight: 1.4,
  },
  codeBlock: {
    display: 'block',
    background: '#f4f4f4',
    color: '#1a1a1a',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    fontSize: 13,
    padding: '8px 12px',
    borderRadius: 6,
    width: '100%',
  },
  dismissBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
    border: 'none',
    borderRadius: 8,
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 500,
    color: '#666',
    cursor: 'pointer',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    transition: 'background 120ms ease',
  },
  loadingDots: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  dotsWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#ccc',
    display: 'inline-block',
    animation: 'pulse 1s ease-in-out infinite',
  },
  splitWrap: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#999',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  originalText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#555',
    maxHeight: 110,
    overflowY: 'auto',
    wordBreak: 'break-word',
  },
  divider: {
    height: 1,
    background: '#f0f0f0',
    margin: '10px 0',
    flexShrink: 0,
  },
  suggestedText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#222',
    wordBreak: 'break-word',
    flex: 1,
    overflowY: 'auto',
  },
  addedChip: {
    background: '#d5f5e3',
    color: '#1e8449',
    borderRadius: 3,
    padding: '0 2px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'border-color 100ms ease',
  },
  rejectedChip: {
    background: '#f5f5f5',
    color: '#999',
    borderRadius: 3,
    padding: '0 2px',
    cursor: 'pointer',
    border: '1px solid #e0e0e0',
  },
  deletionMarker: {
    color: '#c0392b',
    opacity: 0.45,
    textDecoration: 'line-through',
    cursor: 'pointer',
  },
}
