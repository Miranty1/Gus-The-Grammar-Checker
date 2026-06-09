import React, { useState, useEffect, useRef } from 'react'
import ModePills from './components/ModePills'
import DiffView from './components/DiffView'
import ActionBar from './components/ActionBar'
import { useOllama } from './hooks/useOllama'
import { computeDiff, groupOps, buildResult } from './utils/diff'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function App() {
  const [inputText, setInputText] = useState('')
  const [mode, setMode] = useState('grammar')
  const [tone, setTone] = useState('formal')
  const [status, setStatus] = useState('idle')
  const [groupedOps, setGroupedOps] = useState([])
  const [rejectedHunks, setRejectedHunks] = useState(new Set())
  const [exiting, setExiting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const modeRef = useRef('grammar')
  const toneRef = useRef('formal')
  const inputRef = useRef('')
  const handleAcceptRef = useRef(null)

  const { generate, error } = useOllama()

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { toneRef.current = tone }, [tone])

  async function runGenerate(text, currentMode, currentTone) {
    setStatus('loading')
    setGroupedOps([])
    setRejectedHunks(new Set())
    const out = await generate(text, currentMode, currentTone)
    if (out) {
      const ops = computeDiff(text, out)
      setGroupedOps(groupOps(ops))
      setStatus('result')
    } else {
      setStatus('error')
    }
  }

  useEffect(() => {
    window.electronAPI.on('clipboard-text', async (text) => {
      inputRef.current = text
      setInputText(text)
      setExiting(false)
      setShowSettings(false)
      await runGenerate(text, modeRef.current, toneRef.current)
    })
    window.electronAPI.on('open-settings', () => {
      setShowSettings(true)
    })
    return () => {
      window.electronAPI.removeAllListeners('clipboard-text')
      window.electronAPI.removeAllListeners('open-settings')
    }
  }, [])

  async function handleModeChange(newMode) {
    setMode(newMode)
    modeRef.current = newMode
    if (!inputRef.current) return
    await runGenerate(inputRef.current, newMode, toneRef.current)
  }

  async function handleToneChange(newTone) {
    setTone(newTone)
    toneRef.current = newTone
    if (!inputRef.current) return
    await runGenerate(inputRef.current, modeRef.current, newTone)
  }

  function handleToggleHunk(id) {
    setRejectedHunks(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Mouse-triggered accept: plays exit animation
  function handleAccept() {
    if (status !== 'result') return
    const effective = buildResult(groupedOps, rejectedHunks)
    window.electronAPI.send('write-clipboard', effective)
    if (prefersReducedMotion()) {
      window.electronAPI.send('close-window')
      return
    }
    setExiting(true)
    setTimeout(() => window.electronAPI.send('close-window'), 110)
  }

  // Keyboard Enter: immediate close, no animation
  function handleAcceptImmediate() {
    if (status !== 'result') return
    const effective = buildResult(groupedOps, rejectedHunks)
    window.electronAPI.send('write-clipboard', effective)
    window.electronAPI.send('close-window')
  }

  handleAcceptRef.current = handleAcceptImmediate

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter' && !e.repeat) handleAcceptRef.current?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Mouse-triggered dismiss: plays exit animation
  function handleDismiss() {
    if (prefersReducedMotion()) {
      window.electronAPI.send('close-window')
      return
    }
    setExiting(true)
    setTimeout(() => window.electronAPI.send('close-window'), 110)
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; background: #ffffff; }
        button:active { transform: scale(0.97) !important; }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes pulse { 0%, 100% { opacity: 0.6; } }
        }
      `}</style>

      <div style={{
        ...styles.panel,
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(0.97)' : 'scale(1)',
        transition: exiting
          ? 'opacity 100ms cubic-bezier(0.23,1,0.32,1), transform 100ms cubic-bezier(0.23,1,0.32,1)'
          : 'none',
      }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoMark}>G</div>
            <div>
              <div style={styles.appName}>Gus</div>
              <div style={styles.appSub}>The grammar checker</div>
            </div>
          </div>
          <div style={styles.shortcutPill}>⌘ ⌥ G</div>
        </div>

        {/* Mode pills */}
        <div style={styles.pillsWrap}>
          <ModePills
            activeMode={mode}
            onModeChange={handleModeChange}
            activeTone={tone}
            onToneChange={handleToneChange}
          />
        </div>

        {/* Diff content */}
        <div style={styles.content}>
          <DiffView
            status={status}
            original={inputText}
            groupedOps={groupedOps}
            rejectedHunks={rejectedHunks}
            onToggleHunk={handleToggleHunk}
            onDismiss={handleDismiss}
            error={error}
          />
        </div>

        <ActionBar
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          disabled={status !== 'result'}
        />

        {/* Settings overlay */}
        {showSettings && (
          <SettingsOverlay onClose={() => setShowSettings(false)} />
        )}
      </div>
    </>
  )
}

function eventToAccelerator(e) {
  const parts = []
  if (e.metaKey || e.ctrlKey) parts.push('CommandOrControl')
  if (e.altKey)   parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  let key = e.key
  if (key.startsWith('Arrow')) key = key.slice(5)
  if (key === ' ') key = 'Space'
  if (key === 'Enter') key = 'Return'
  if (key.length === 1) key = key.toUpperCase()
  parts.push(key)
  return parts.join('+')
}

function SettingsOverlay({ onClose }) {
  const [shortcutInput, setShortcutInput] = useState('')
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    window.electronAPI.invoke('load-settings').then(s => {
      setShortcutInput(s.shortcut)
    })
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
      onClose()
    } else {
      setSaveError(res.error)
    }
  }

  return (
    <div style={settingsStyles.overlay}>
      <button
        onClick={onClose}
        style={settingsStyles.backBtn}
        onMouseEnter={e => e.currentTarget.style.color = '#111'}
        onMouseLeave={e => e.currentTarget.style.color = '#888'}
      >
        ← Back
      </button>

      <div style={settingsStyles.body}>
        <h2 style={settingsStyles.heading}>Settings</h2>

        <label style={settingsStyles.label}>Global shortcut</label>

        {recording ? (
          <>
            <div style={settingsStyles.captureBox}>
              Press shortcut…
            </div>
            <p style={settingsStyles.hint}>Esc to cancel</p>
          </>
        ) : (
          <>
            <div style={settingsStyles.inputRow}>
              <input
                style={settingsStyles.input}
                value={shortcutInput}
                onChange={e => { setShortcutInput(e.target.value); setSaveError(null) }}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                spellCheck={false}
                placeholder="CommandOrControl+Alt+G"
              />
              <button
                onClick={() => setRecording(true)}
                style={settingsStyles.recordBtn}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Record
              </button>
            </div>
            <p style={settingsStyles.hint}>
              Or type in Electron accelerator format, e.g. <code style={settingsStyles.inlineCode}>CommandOrControl+Shift+G</code>
            </p>
          </>
        )}

        {saveError && <p style={settingsStyles.errorText}>{saveError}</p>}
      </div>

      <div style={settingsStyles.footer}>
        <button
          onClick={onClose}
          style={settingsStyles.cancelBtn}
          onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ ...settingsStyles.saveBtn, ...(saving ? settingsStyles.saveBtnDisabled : {}) }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  panel: {
    width: '100vw',
    height: '100vh',
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    display: 'flex',
    flexDirection: 'column',
    padding: '18px 20px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: '#E6F1FB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 700,
    color: '#0C447C',
    flexShrink: 0,
  },
  appName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111',
    lineHeight: 1.2,
  },
  appSub: {
    fontSize: 11,
    color: '#888',
    lineHeight: 1.2,
  },
  shortcutPill: {
    fontSize: 11,
    color: '#777',
    background: '#f5f5f5',
    border: '1px solid #e8e8e8',
    borderRadius: 20,
    padding: '3px 9px',
    fontFamily: '-apple-system, sans-serif',
    letterSpacing: '0.02em',
  },
  pillsWrap: {
    marginBottom: 14,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    marginBottom: 4,
  },
}

const btnBase = {
  border: 'none',
  borderRadius: 8,
  padding: '7px 16px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  transition: 'background 120ms cubic-bezier(0.23,1,0.32,1)',
}

const settingsStyles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: '#fff',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    padding: '14px 20px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  backBtn: {
    ...btnBase,
    background: 'transparent',
    color: '#888',
    padding: '4px 0',
    alignSelf: 'flex-start',
    fontSize: 13,
    transition: 'color 120ms ease',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingTop: 16,
  },
  heading: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
    color: '#888',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
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
    marginTop: 4,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 12,
    borderTop: '1px solid #f0f0f0',
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
  saveBtnDisabled: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
}
