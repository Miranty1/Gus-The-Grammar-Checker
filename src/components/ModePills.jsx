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
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {Object.entries(MODES).map(([key, { label }]) => (
          <Pill
            key={key}
            label={label}
            active={activeMode === key}
            colors={MODE_COLORS[key]}
            onClick={() => onModeChange(key)}
          />
        ))}
      </div>

      {activeMode === 'tone' && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
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
      )}
    </div>
  )
}
