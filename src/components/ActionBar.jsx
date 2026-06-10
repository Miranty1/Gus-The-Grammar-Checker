import React from 'react'
import { btnBase } from '../styles/base'

export default function ActionBar({ onAccept, onDismiss, disabled }) {
  return (
    <div style={styles.bar}>
      <button
        onClick={onDismiss}
        style={styles.dismiss}
        onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        Dismiss
      </button>
      <button
        onClick={onAccept}
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
