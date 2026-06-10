import { useState } from 'react'
import { MODES } from '../prompts'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const MODEL = 'llama3.1:8b'

export function useOllama() {
  const [error, setError] = useState(null)

  async function generate(text, mode, tone = 'formal', signal) {
    setError(null)

    const systemPrompt = MODES[mode].prompt.replace('{{tone}}', tone)
    const fetchSignal = signal
      ? AbortSignal.any([signal, AbortSignal.timeout(30_000)])
      : AbortSignal.timeout(30_000)

    try {
      let res
      try {
        res = await fetch(OLLAMA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL,
            system: systemPrompt,
            prompt: text,
            stream: false,
          }),
          signal: fetchSignal,
        })
      } catch (err) {
        if (err.name === 'TimeoutError') {
          throw new Error('Ollama took too long to respond — check that it\'s still running.')
        }
        if (err.name === 'AbortError') throw err
        throw new Error('Gus needs Ollama running — open Terminal and run: ollama serve')
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Ollama error ${res.status}: ${body || res.statusText}`)
      }

      const data = await res.json()
      return data.response
    } catch (err) {
      if (err.name === 'AbortError') throw err
      setError(err.message)
      return null
    }
  }

  return { generate, error }
}
