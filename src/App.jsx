import React, { useState, useEffect, useRef } from 'react'
import ModePills from './components/ModePills'
import DiffView from './components/DiffView'
import ActionBar from './components/ActionBar'
import Dashboard from './Dashboard'
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
  const [appeared, setAppeared] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [shortcut, setShortcut] = useState(null)
  const [truncated, setTruncated] = useState(false)

  const modeRef = useRef('grammar')
  const toneRef = useRef('formal')
  const inputRef = useRef('')
  const handleAcceptRef = useRef(null)
  const abortRef = useRef(null)

  const { generate, error } = useOllama()

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { toneRef.current = tone }, [tone])

  useEffect(() => {
    window.electronAPI.invoke('load-settings').then(s => {
      if (s?.shortcut) setShortcut(s.shortcut)
    })
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAppeared(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  async function runGenerate(text, currentMode, currentTone) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('loading')
    setGroupedOps([])
    setRejectedHunks(new Set())

    try {
      const out = await generate(text, currentMode, currentTone, controller.signal)
      if (controller.signal.aborted) return
      if (out) {
        const ops = computeDiff(text, out)
        setGroupedOps(groupOps(ops))
        setStatus('result')
      } else {
        setStatus('error')
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      setStatus('error')
    }
  }

  useEffect(() => {
    window.electronAPI.on('clipboard-text', async (payload) => {
      const text = typeof payload === 'string' ? payload : payload.text
      inputRef.current = text
      setInputText(text)
      setTruncated(typeof payload === 'object' ? payload.truncated : false)
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
    window.electronAPI.send('record-usage', mode)
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
    window.electronAPI.send('record-usage', mode)
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
        body { overflow: hidden; background: transparent; }
        button:active { transform: scale(0.97) !important; }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes pulse { 0%, 100% { opacity: 0.6; } }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
      `}</style>

      <div style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        opacity: exiting ? 0 : appeared ? 1 : 0,
        transform: exiting
          ? 'scale(0.97)'
          : (appeared || prefersReducedMotion()) ? 'scale(1) translateY(0px)' : 'scale(0.96) translateY(-5px)',
        transition: exiting
          ? 'opacity 100ms cubic-bezier(0.23,1,0.32,1), transform 100ms cubic-bezier(0.23,1,0.32,1)'
          : appeared
          ? 'opacity 180ms cubic-bezier(0.23,1,0.32,1), transform 180ms cubic-bezier(0.23,1,0.32,1)'
          : 'none',
        filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.13))',
      }}>
        {/* CSS nib triangle */}
        <div style={styles.nib} />

        {/* Frosted glass panel */}
        <div style={styles.panel}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.logoMark}>G</div>
              <div>
                <div style={styles.appName}>Gus</div>
                <div style={styles.appSub}>The grammar checker</div>
              </div>
            </div>
            {shortcut && <div style={styles.shortcutPill}>{acceleratorToSymbols(shortcut)}</div>}
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

          {/* Truncation notice */}
          {truncated && (
            <div style={styles.truncatedNotice}>
              Text clipped to 5,000 characters
            </div>
          )}

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
              shortcut={shortcut ? acceleratorToSymbols(shortcut) : ''}
            />
          </div>

          <ActionBar
            onAccept={handleAccept}
            onDismiss={handleDismiss}
            disabled={status !== 'result'}
          />

          {/* Settings / dashboard overlay */}
          {showSettings && (
            <Dashboard
              onClose={() => setShowSettings(false)}
              onShortcutSaved={setShortcut}
            />
          )}
        </div>
      </div>
    </>
  )
}

const ACCELERATOR_SYMBOLS = {
  CommandOrControl: '⌘', Command: '⌘', Control: '⌃', Ctrl: '⌃',
  Alt: '⌥', Option: '⌥', Shift: '⇧', Super: '⊞',
}

function acceleratorToSymbols(accelerator) {
  return accelerator.split('+').map(p => ACCELERATOR_SYMBOLS[p] ?? p.toUpperCase()).join(' ')
}

const styles = {
  nib: {
    position: 'absolute',
    top: 0,
    left: 'calc(50% - 11px)',
    width: 0,
    height: 0,
    borderLeft: '11px solid transparent',
    borderRight: '11px solid transparent',
    borderBottom: '12px solid #fff',
    zIndex: 2,
  },
  panel: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '18px 20px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflow: 'hidden',
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
  },
  pillsWrap: {
    marginBottom: 14,
  },
  truncatedNotice: {
    fontSize: 11,
    color: '#a0522d',
    background: '#fff8f0',
    border: '1px solid #f5d9b8',
    borderRadius: 6,
    padding: '4px 10px',
    marginBottom: 8,
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

