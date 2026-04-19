import { useCallback } from 'react'

export function useAlertStream() {
  const startCascade = useCallback(async (incident, onTier) => {
    try {
      const response = await fetch('/api/alert/cascade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() // keep incomplete chunk
        for (const chunk of chunks) {
          const line = chunk.trim()
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onTier(data)
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      console.error('Alert stream error:', err)
    }
  }, [])

  return { startCascade }
}
