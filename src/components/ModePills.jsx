import React from 'react'
import { MODES, TONE_OPTIONS } from '../prompts'

const MODE_COLORS = {
  grammar:    { bg: '#E6F1FB', text: '#0C447C', border: '#B5D4F4' },
  refinement: { bg: '#EEEDFE', text: '#3C3489', border: '#CECBF6' },
  tone:       { bg: '#E1F5EE', text: '#085041', border: '#9FE1CB' },
  concise:    { bg: '#FAEEDA', text: '#633806', border: '#FAC775' },
}

const INACTIVE = { bg: '#F5F5F5', text: '#666', border: '#E0E0E0' }

const pillBase = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  border: '1px solid',
  cursor: 'pointer',
  transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
  userSelect: 'none',
  lineHeight: 1.4,
}

function Pill({ label, active, colors, onClick }) {
  const c = active ? colors : INACTIVE
  return (
    <button
      onClick={onClick}
      style={{
        ...pillBase,
        background: c.bg,
        color: c.text,
        borderColor: c.border,
      }}
    >
      {label}
    </button>
  )
}

export default function ModePills({ activeMode, onModeChange, activeTone, onToneChange }) {
  return (
    <div>
      <p style={styles.rowLabel}>Mode</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.entries(MODES).map(([key, { label }]) => (
          <Pill
            key={key}
            label={label}
            active={activeMode === key}
            colors={MODE_COLORS[key] ?? INACTIVE}
            onClick={() => onModeChange(key)}
          />
        ))}
      </div>

      <div className={`tone-pills${MODES[activeMode]?.supportsTone ? ' visible' : ''}`}>
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerLabel}>Tone</span>
          <span style={styles.dividerLine} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {TONE_OPTIONS.map((t) => (
            <Pill
              key={t}
              label={t}
              active={activeTone === t}
              colors={MODE_COLORS.tone}
              onClick={() => onToneChange(t)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  rowLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#aaa',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 6,
    textAlign: 'center',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#e8e8e8',
    display: 'block',
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#aaa',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    flexShrink: 0,
  },
}
