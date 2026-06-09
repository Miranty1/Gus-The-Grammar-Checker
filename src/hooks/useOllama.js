import { useState } from 'react'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const MODEL = 'llama3.1:8b'

export function useOllama() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function generate(text, systemPrompt) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          system: systemPrompt,
          prompt: text,
          stream: false,
        }),
      })
      if (!res.ok) throw new Error('Ollama request failed')
      const data = await res.json()
      return data.response
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { generate, loading, error }
}
