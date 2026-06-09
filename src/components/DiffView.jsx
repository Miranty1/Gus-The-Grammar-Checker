import React, { useMemo } from 'react'

function tokenize(str) {
  return str.match(/\S+|\s+/g) || []
}

function computeDiff(original, suggested) {
  const a = tokenize(original)
  const b = tokenize(suggested)
  const m = a.length
  const n = b.length

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])

  const ops = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.unshift({ type: 'equal', text: a[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'add', text: b[j - 1] })
      j--
    } else {
      ops.unshift({ type: 'remove', text: a[i - 1] })
      i--
    }
  }
  return ops
}

export default function DiffView({ status, original, suggested, error }) {
  const ops = useMemo(() => {
    if (status !== 'result' || !original || !suggested) return []
    return computeDiff(original, suggested)
  }, [status, original, suggested])

  if (status === 'idle') {
    return (
      <div style={styles.centered}>
        <p style={styles.muted}>Copy some text, then press <kbd style={styles.kbd}>⌘ ⌥ G</kbd></p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div style={styles.centered}>
        <div style={styles.loadingDots}>
          <span style={{ ...styles.dot, animationDelay: '0ms' }} />
          <span style={{ ...styles.dot, animationDelay: '160ms' }} />
          <span style={{ ...styles.dot, animationDelay: '320ms' }} />
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={styles.errorBox}>
        <p style={styles.errorText}>{error}</p>
      </div>
    )
  }

  return (
    <div style={styles.diffWrap}>
      {ops.map((op, idx) => {
        if (op.type === 'equal') return <span key={idx}>{op.text}</span>
        if (op.type === 'remove') return (
          <span key={idx} style={styles.remove}>{op.text}</span>
        )
        return (
          <span key={idx} style={styles.add}>{op.text}</span>
        )
      })}
    </div>
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
    color: '#aaa',
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
  loadingDots: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#ccc',
    display: 'inline-block',
    animation: 'pulse 1s ease-in-out infinite',
  },
  errorBox: {
    margin: '4px 0',
    padding: '12px 14px',
    background: '#fff5f5',
    border: '1px solid #fecaca',
    borderRadius: 10,
  },
  errorText: {
    margin: 0,
    fontSize: 13,
    color: '#b91c1c',
    lineHeight: 1.5,
  },
  diffWrap: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#222',
    wordBreak: 'break-word',
  },
  remove: {
    color: '#c0392b',
    textDecoration: 'line-through',
    opacity: 0.8,
  },
  add: {
    background: '#d5f5e3',
    color: '#1e8449',
    borderRadius: 3,
    padding: '0 2px',
  },
}
