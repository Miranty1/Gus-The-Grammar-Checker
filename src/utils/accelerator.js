const IGNORED_KEYS = new Set(['Dead', 'Process', 'Unidentified', 'CapsLock'])

export function eventToAccelerator(e) {
  if (IGNORED_KEYS.has(e.key)) return null
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
