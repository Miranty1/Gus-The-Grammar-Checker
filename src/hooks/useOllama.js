import { useState } from 'react'
import { MODES } from '../prompts'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const MODEL = 'llama3.1:8b'

// Strip common LLM preamble lines the model adds despite being told not to.
// Matches lines like "Here is the corrected text:", "Here's the improved version:", etc.
function stripPreamble(text) {
  if (!text) return text
  return text.replace(/^(here(?:'s| is)[^:\n]*:\s*\n+)/i, '').trim()
}

export function useOllama() {
  const [error, setError] = useState(null)

  async function generate(text, mode, tone = 'professional', signal, onChunk) {
    setError(null)

    const systemPrompt = MODES[mode].prompt.replace('{{tone}}', tone)
    // Short timeout for the initial connection only — stream reads use the user abort signal
    const connectSignal = signal
      ? AbortSignal.any([signal, AbortSignal.timeout(10_000)])
      : AbortSignal.timeout(10_000)

    const inputWords = text.split(' ').length
    const num_predict = Math.min(inputWords * 3, 600)

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
            stream: true,
            num_predict,
          }),
          signal: connectSignal,
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

      // Reuse the same TextDecoder instance across all chunks so { stream: true }
      // correctly handles multi-byte characters (em dashes, smart quotes) at chunk boundaries.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let lineBuffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (signal?.aborted) throw Object.assign(new Error(), { name: 'AbortError' })
        lineBuffer += decoder.decode(value, { stream: true })
        const lines = lineBuffer.split('\n')
        lineBuffer = lines.pop()
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const json = JSON.parse(line)
            if (json.response) {
              accumulated += json.response
              onChunk?.(stripPreamble(accumulated))
            }
          } catch { /* skip malformed line */ }
        }
      }
      // Flush any remaining buffered line (e.g. Ollama's final {"done":true} close marker)
      if (lineBuffer.trim()) {
        try {
          const json = JSON.parse(lineBuffer)
          if (json.response) {
            accumulated += json.response
            onChunk?.(stripPreamble(accumulated))
          }
        } catch { /* ignore */ }
      }
      return stripPreamble(accumulated)
    } catch (err) {
      if (err.name === 'AbortError') throw err
      setError(err.message)
      return null
    }
  }

  return { generate, error }
}
