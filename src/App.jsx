import React, { useState, useEffect, useRef } from 'react'
import SegmentedControl from './components/SegmentedControl'
import ToneRow from './components/ToneRow'
import DiffView from './components/DiffView'
import Footer from './components/Footer'
import Dashboard from './Dashboard'
import { useOllama } from './hooks/useOllama'
import { computeDiff, groupOps, buildResult } from './utils/diff'
import { MODES } from './prompts'

const EXIT_MS = 120
const _prefersReducedMotionMQL = window.matchMedia('(prefers-reduced-motion: reduce)')
function prefersReducedMotion() { return _prefersReducedMotionMQL.matches }

export default function App() {
  const [inputText, setInputText] = useState('')
  const [mode, setMode] = useState('grammar')
  const [tone, setTone] = useState('professional')
  const [status, setStatus] = useState('idle')
  const [groupedOps, setGroupedOps] = useState([])
  const [rejectedHunks, setRejectedHunks] = useState(new Set())
  const [exiting, setExiting] = useState(false)
  const [appeared, setAppeared] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [shortcut, setShortcut] = useState(null)
  const [truncated, setTruncated] = useState(false)
  const [streamingText, setStreamingText] = useState('')

  const modeRef = useRef('grammar')
  const toneRef = useRef('professional')
  const inputRef = useRef('')
  const handleAcceptRef = useRef(null)
  const handleDismissRef = useRef(null)
  const abortRef = useRef(null)
  const runGenerateRef = useRef(null)
  const showSettingsRef = useRef(false)

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
    setStreamingText('')

    // Ollama can emit several chunks between frames; buffer the latest partial
    // and flush once per frame so renders are capped at display refresh rate.
    let pendingPartial = ''
    let rafId = null
    const flush = () => {
      rafId = null
      if (!controller.signal.aborted) setStreamingText(pendingPartial)
    }

    try {
      const out = await generate(text, currentMode, currentTone, controller.signal, (partial) => {
        if (controller.signal.aborted) return
        pendingPartial = partial
        if (rafId === null) rafId = requestAnimationFrame(flush)
      })
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (controller.signal.aborted) return
      setStreamingText('')
      if (out) {
        setGroupedOps(groupOps(computeDiff(text, out)))
        setStatus('result')
      } else {
        setStatus('error')
      }
    } catch (err) {
      if (rafId !== null) cancelAnimationFrame(rafId)
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
      setAppeared(false)
      setShowSettings(false)
      requestAnimationFrame(() => requestAnimationFrame(() => setAppeared(true)))
      await runGenerateRef.current(text, modeRef.current, toneRef.current)
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
    setTimeout(() => window.electronAPI.send('close-window'), EXIT_MS + 10)
  }

  // Keyboard Enter: immediate close, no animation
  function handleAcceptImmediate() {
    if (status !== 'result') return
    window.electronAPI.send('record-usage', mode)
    const effective = buildResult(groupedOps, rejectedHunks)
    window.electronAPI.send('write-clipboard', effective)
    window.electronAPI.send('close-window')
  }

  // Mouse-triggered dismiss: plays exit animation
  function handleDismiss() {
    abortRef.current?.abort()
    if (prefersReducedMotion()) {
      window.electronAPI.send('close-window')
      return
    }
    setExiting(true)
    setTimeout(() => window.electronAPI.send('close-window'), EXIT_MS + 10)
  }

  handleAcceptRef.current = handleAcceptImmediate
  handleDismissRef.current = handleDismiss
  runGenerateRef.current = runGenerate
  showSettingsRef.current = showSettings

  useEffect(() => {
    function onKey(e) {
      if (showSettingsRef.current) {
        // Settings overlay owns the keyboard; Escape backs out of it
        // (shortcut recording stops propagation, so it isn't affected here)
        if (e.key === 'Escape') setShowSettings(false)
        return
      }
      if (e.key === 'Enter' && !e.repeat) handleAcceptRef.current?.()
      if (e.key === 'Escape') handleDismissRef.current?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const mounted = appeared && !exiting

  return (
    <div className={`gus-root${mounted ? ' mounted' : ''}`}>
      <div className="gus-nib" />

      <div className="gus-panel">
        <div className="header">
          <SegmentedControl activeMode={mode} onModeChange={handleModeChange} />
          {shortcut && <div className="shortcut-chip">{acceleratorToSymbols(shortcut)}</div>}
          <button
            className="icon-btn"
            title="Settings"
            aria-label="Settings"
            onClick={() => setShowSettings(true)}
          >
            <GearIcon />
          </button>
        </div>

        <ToneRow
          visible={!!MODES[mode]?.supportsTone}
          activeTone={tone}
          onToneChange={handleToneChange}
        />

        {truncated && (
          <div className="notice-truncated">
            Text clipped to 5,000 characters
          </div>
        )}

        <div className="content">
          <DiffView
            status={status}
            original={inputText}
            groupedOps={groupedOps}
            rejectedHunks={rejectedHunks}
            onToggleHunk={handleToggleHunk}
            onDismiss={handleDismiss}
            error={error}
            shortcut={shortcut ? acceleratorToSymbols(shortcut) : ''}
            streamingText={streamingText}
          />
        </div>

        <Footer
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          disabled={status !== 'result'}
          status={status}
        />

        {showSettings && (
          <Dashboard
            onClose={() => setShowSettings(false)}
            onShortcutSaved={setShortcut}
          />
        )}
      </div>
    </div>
  )
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.6 1.6a.7.7 0 0 1 .69-.6h1.42a.7.7 0 0 1 .69.6l.17 1.18c.04.27.23.49.47.61.25.12.53.13.77 0l1.1-.47a.7.7 0 0 1 .87.3l.71 1.23a.7.7 0 0 1-.18.9l-.93.72c-.21.17-.31.43-.31.7 0 .27.1.53.31.7l.93.72a.7.7 0 0 1 .18.9l-.71 1.23a.7.7 0 0 1-.87.3l-1.1-.47a.86.86 0 0 0-.77 0c-.24.12-.43.34-.47.61l-.17 1.18a.7.7 0 0 1-.69.6H7.29a.7.7 0 0 1-.69-.6l-.17-1.18a.85.85 0 0 0-.47-.61.86.86 0 0 0-.77 0l-1.1.47a.7.7 0 0 1-.87-.3l-.71-1.23a.7.7 0 0 1 .18-.9l.93-.72c.21-.17.31-.43.31-.7 0-.27-.1-.53-.31-.7l-.93-.72a.7.7 0 0 1-.18-.9l.71-1.23a.7.7 0 0 1 .87-.3l1.1.47c.24.13.52.12.77 0 .24-.12.43-.34.47-.61L6.6 1.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

const ACCELERATOR_SYMBOLS = {
  CommandOrControl: '⌘', Command: '⌘', Control: '⌃', Ctrl: '⌃',
  Alt: '⌥', Option: '⌥', Shift: '⇧', Super: '⊞',
}

function acceleratorToSymbols(accelerator) {
  return accelerator.split('+').map(p => ACCELERATOR_SYMBOLS[p] ?? p.toUpperCase()).join(' ')
}
