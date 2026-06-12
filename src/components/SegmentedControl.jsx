import React from 'react'
import { MODES } from '../prompts'

// Short labels that fit four equal segments at 520px window width
const SHORT_LABELS = {
  grammar: 'Grammar',
  refinement: 'Refine',
  tone: 'Tone',
  concise: 'Concise',
}

const MODE_KEYS = Object.keys(MODES)

export default function SegmentedControl({ activeMode, onModeChange }) {
  const activeIdx = Math.max(0, MODE_KEYS.indexOf(activeMode))

  return (
    <div className="seg" role="tablist" aria-label="Mode">
      <div
        className="seg-thumb"
        style={{ transform: `translateX(${activeIdx * 100}%)` }}
      />
      {MODE_KEYS.map((key) => (
        <button
          key={key}
          role="tab"
          aria-selected={activeMode === key}
          className={`seg-btn${activeMode === key ? ' active' : ''}`}
          onClick={() => onModeChange(key)}
        >
          {SHORT_LABELS[key] ?? MODES[key].label}
        </button>
      ))}
    </div>
  )
}
