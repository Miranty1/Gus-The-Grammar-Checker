import React, { useState } from 'react'
import { btnBase } from '../styles/base'

export default function ActionBar({ onAccept, onDismiss, disabled }) {
  const [dismissHovered, setDismissHovered] = useState(false)
  return (
    <div style={styles.bar}>
      <button
        onClick={onDismiss}
        style={{ ...styles.dismiss, background: dismissHovered ? '#f5f5f5' : 'transparent' }}
        onMouseEnter={() => setDismissHovered(true)}
        onMouseLeave={() => setDismissHovered(false)}
      >
        Dismiss
      </button>
      <button
        onClick={disabled ? undefined : onAccept}
        disabled={disabled}
        style={{ ...styles.accept, ...(disabled ? styles.acceptDisabled : {}) }}
      >
        Accept ↵
      </button>
    </div>
  )
}

const styles = {
  bar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 12,
    borderTop: '1px solid #f0f0f0',
  },
  dismiss: {
    ...btnBase,
    background: 'transparent',
    color: '#666',
  },
  accept: {
    ...btnBase,
    background: '#0C447C',
    color: '#fff',
  },
  acceptDisabled: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
}
