import React, { useState, useEffect } from 'react'
import OllamaStatus from './dashboard/OllamaStatus'
import UsageStats from './dashboard/UsageStats'
import { eventToAccelerator } from './utils/accelerator'

const NAV_ITEMS = [
  { id: 'ollama', label: 'Ollama Status' },
  { id: 'usage', label: 'Usage' },
  { id: 'shortcut', label: 'Shortcut' },
]

export default function Dashboard({ onClose, onShortcutSaved }) {
  const [activeSection, setActiveSection] = useState('ollama')

  return (
    <div className="settings-overlay">
      <div className="settings-topbar">
        <button className="settings-back" onClick={onClose}>← Back</button>
        <span className="settings-title">Settings</span>
      </div>

      <div className="settings-body">
        <nav className="settings-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`settings-nav-item${activeSection === item.id ? ' active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {activeSection === 'ollama'   && <OllamaStatus />}
          {activeSection === 'usage'    && <UsageStats />}
          {activeSection === 'shortcut' && <ShortcutSection onClose={onClose} onShortcutSaved={onShortcutSaved} />}
        </div>
      </div>
    </div>
  )
}

function ShortcutSection({ onClose, onShortcutSaved }) {
  const [shortcutInput, setShortcutInput] = useState('')
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    window.electronAPI.invoke('load-settings')
      .then(s => setShortcutInput(s?.shortcut ?? ''))
      .catch(() => setShortcutInput('CommandOrControl+Alt+G'))
  }, [])

  useEffect(() => {
    if (!recording) return
    function onKey(e) {
      e.preventDefault()
      e.stopPropagation()
      if (['Meta', 'Control', 'Alt', 'Shift', 'OS'].includes(e.key)) return
      if (e.key === 'Escape') { setRecording(false); return }
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) return
      setShortcutInput(eventToAccelerator(e))
      setSaveError(null)
      setRecording(false)
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [recording])

  async function handleSave() {
    if (!shortcutInput.trim()) return
    setSaving(true)
    setSaveError(null)
    const res = await window.electronAPI.invoke('save-shortcut', shortcutInput.trim())
    setSaving(false)
    if (res.ok) {
      onShortcutSaved?.(shortcutInput.trim())
      onClose()
    } else {
      setSaveError(res.error)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <p className="section-label">Global shortcut</p>

      {recording ? (
        <>
          <div className="capture-box">Press shortcut…</div>
          <p className="hint">Esc to cancel</p>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="input"
              value={shortcutInput}
              onChange={e => { setShortcutInput(e.target.value); setSaveError(null) }}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              spellCheck={false}
              placeholder="CommandOrControl+Alt+G"
            />
            <button className="btn-outline" onClick={() => setRecording(true)}>
              Record
            </button>
          </div>
          <p className="hint">
            Or type in Electron accelerator format, e.g.{' '}
            <code className="inline-code">CommandOrControl+Shift+G</code>
          </p>
        </>
      )}

      {saveError && <p className="error-text">{saveError}</p>}

      <div className="settings-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
