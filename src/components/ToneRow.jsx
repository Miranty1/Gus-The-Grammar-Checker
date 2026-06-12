import React from 'react'
import { TONE_OPTIONS } from '../prompts'

// Always rendered so the grid-rows collapse can animate open/closed
export default function ToneRow({ visible, activeTone, onToneChange }) {
  return (
    <div className={`tone-row${visible ? ' visible' : ''}`} aria-hidden={!visible}>
      <div className="tone-row-inner">
        {TONE_OPTIONS.map((t) => (
          <button
            key={t}
            className={`tone-pill${activeTone === t ? ' active' : ''}`}
            onClick={() => onToneChange(t)}
            tabIndex={visible ? 0 : -1}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
