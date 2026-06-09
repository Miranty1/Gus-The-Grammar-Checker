import React, { useState, useEffect, useRef } from 'react'
import ModePills from './components/ModePills'
import DiffView from './components/DiffView'
import ActionBar from './components/ActionBar'
import { useOllama } from './hooks/useOllama'

export default function App() {
  const [inputText, setInputText] = useState('')
  const [mode, setMode] = useState('grammar')
  const [tone, setTone] = useState('formal')
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('idle')

  const modeRef = useRef('grammar')
  const toneRef = useRef('formal')
  const inputRef = useRef('')

  const { generate, error } = useOllama()

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { toneRef.current = tone }, [tone])

  useEffect(() => {
    window.electronAPI.on('clipboard-text', async (text) => {
      inputRef.current = text
      setInputText(text)
      setResult(null)
      setStatus('loading')
      const out = await generate(text, modeRef.current, toneRef.current)
      setResult(out ?? null)
      setStatus(out ? 'result' : 'error')
    })
    return () => window.electronAPI.removeAllListeners('clipboard-text')
  }, [])

  async function handleModeChange(newMode) {
    setMode(newMode)
    modeRef.current = newMode
    if (!inputRef.current) return
    setStatus('loading')
    setResult(null)
    const out = await generate(inputRef.current, newMode, toneRef.current)
    setResult(out ?? null)
    setStatus(out ? 'result' : 'error')
  }

  async function handleToneChange(newTone) {
    setTone(newTone)
    toneRef.current = newTone
    if (!inputRef.current) return
    setStatus('loading')
    setResult(null)
    const out = await generate(inputRef.current, modeRef.current, newTone)
    setResult(out ?? null)
    setStatus(out ? 'result' : 'error')
  }

  function handleAccept() {
    if (result) {
      window.electronAPI.send('write-clipboard', result)
      window.electronAPI.send('close-window')
    }
  }

  function handleDismiss() {
    window.electronAPI.send('close-window')
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
      `}</style>

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
            suggested={result}
            error={error}
          />
        </div>

        {/* Action bar */}
        <ActionBar
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          disabled={status !== 'result'}
        />
      </div>
    </>
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
    color: '#aaa',
    lineHeight: 1.2,
  },
  shortcutPill: {
    fontSize: 11,
    color: '#999',
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
    overflowY: 'auto',
    marginBottom: 4,
    minHeight: 0,
  },
}
