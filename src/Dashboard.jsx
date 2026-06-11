import React, { useState, useEffect } from 'react'
import OllamaStatus from './dashboard/OllamaStatus'
import UsageStats from './dashboard/UsageStats'
import { btnBase } from './styles/base'
import { eventToAccelerator } from './utils/accelerator'

const NAV_ITEMS = [
  { id: 'ollama', label: 'Ollama Status' },
  { id: 'usage', label: 'Usage' },
  { id: 'shortcut', label: 'Shortcut' },
]

export default function Dashboard({ onClose, onShortcutSaved }) {
  const [activeSection, setActiveSection] = useState('ollama')
  const [hoveredNav, setHoveredNav] = useState(null)
  const [backHovered, setBackHovered] = useState(false)

  return (
    <div style={styles.overlay}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <button
          onClick={onClose}
          style={{ ...styles.backBtn, color: backHovered ? '#111' : '#888' }}
          onMouseEnter={() => setBackHovered(true)}
          onMouseLeave={() => setBackHovered(false)}
        >
          ← Back
        </button>
        <span style={styles.title}>Settings</span>
      </div>

      {/* Body: sidebar + content */}
      <div style={styles.body}>
        <nav style={styles.sidebar}>
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id
            const isHovered = hoveredNav === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                  ...(!isActive && isHovered ? { background: '#f5f5f5' } : {}),
                }}
                onMouseEnter={() => setHoveredNav(item.id)}
                onMouseLeave={() => setHoveredNav(null)}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={styles.divider} />

        <div style={styles.content}>
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
  const [recordHovered, setRecordHovered] = useState(false)
  const [cancelHovered, setCancelHovered] = useState(false)

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
    <div style={shortcutStyles.wrap}>
      <p style={shortcutStyles.sectionLabel}>Global shortcut</p>

      {recording ? (
        <>
          <div style={shortcutStyles.captureBox}>Press shortcut…</div>
          <p style={shortcutStyles.hint}>Esc to cancel</p>
        </>
      ) : (
        <>
          <div style={shortcutStyles.inputRow}>
            <input
              style={shortcutStyles.input}
              value={shortcutInput}
              onChange={e => { setShortcutInput(e.target.value); setSaveError(null) }}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              spellCheck={false}
              placeholder="CommandOrControl+Alt+G"
            />
            <button
              onClick={() => setRecording(true)}
              style={{ ...shortcutStyles.recordBtn, background: recordHovered ? '#f5f5f5' : 'transparent' }}
              onMouseEnter={() => setRecordHovered(true)}
              onMouseLeave={() => setRecordHovered(false)}
            >
              Record
            </button>
          </div>
          <p style={shortcutStyles.hint}>
            Or type in Electron accelerator format, e.g.{' '}
            <code style={shortcutStyles.inlineCode}>CommandOrControl+Shift+G</code>
          </p>
        </>
      )}

      {saveError && <p style={shortcutStyles.errorText}>{saveError}</p>}

      <div style={shortcutStyles.footer}>
        <button
          onClick={onClose}
          style={{ ...shortcutStyles.cancelBtn, background: cancelHovered ? '#f5f5f5' : 'transparent' }}
          onMouseEnter={() => setCancelHovered(true)}
          onMouseLeave={() => setCancelHovered(false)}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ ...shortcutStyles.saveBtn, ...(saving ? { background: '#ccc', cursor: 'not-allowed' } : {}) }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: '#fff',
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 20px 12px',
    borderBottom: '0.5px solid #f0f0f0',
    flexShrink: 0,
  },
  backBtn: {
    ...btnBase,
    background: 'transparent',
    color: '#888',
    padding: '4px 0',
    fontSize: 13,
    transition: 'color 120ms ease',
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111',
  },
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
  },
  sidebar: {
    width: 130,
    flexShrink: 0,
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  divider: {
    width: '0.5px',
    background: '#f0f0f0',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: '16px 18px',
    overflowY: 'auto',
  },
  navItem: {
    ...btnBase,
    background: 'transparent',
    color: '#555',
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 500,
    textAlign: 'left',
    width: '100%',
    borderRadius: 8,
    transition: 'background 100ms ease, color 100ms ease',
  },
  navItemActive: {
    background: '#E6F1FB',
    color: '#0C447C',
  },
}

const shortcutStyles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    height: '100%',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#888',
    letterSpacing: '0.04em',
    marginBottom: 2,
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    color: '#111',
    background: '#f8f8f8',
    border: '1px solid #e8e8e8',
    borderRadius: 8,
    outline: 'none',
  },
  captureBox: {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    fontStyle: 'italic',
    color: '#aaa',
    background: '#f0f6ff',
    border: '1.5px solid #0C447C',
    borderRadius: 8,
    userSelect: 'none',
  },
  recordBtn: {
    ...btnBase,
    background: 'transparent',
    color: '#555',
    padding: '7px 12px',
    flexShrink: 0,
    border: '1px solid #e8e8e8',
  },
  hint: {
    fontSize: 11,
    color: '#aaa',
    lineHeight: 1.5,
  },
  inlineCode: {
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    fontSize: 11,
    color: '#555',
    background: '#f0f0f0',
    padding: '1px 4px',
    borderRadius: 3,
  },
  errorText: {
    fontSize: 12,
    color: '#b91c1c',
    lineHeight: 1.4,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 12,
    borderTop: '0.5px solid #f0f0f0',
  },
  cancelBtn: {
    ...btnBase,
    background: 'transparent',
    color: '#666',
  },
  saveBtn: {
    ...btnBase,
    background: '#0C447C',
    color: '#fff',
  },
}
