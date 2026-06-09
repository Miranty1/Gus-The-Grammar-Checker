import React from 'react'

export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: '#ffffff',
      margin: 0,
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: '#E6F1FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 700,
        color: '#0C447C',
        marginBottom: 12,
      }}>
        G
      </div>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#111' }}>Gus</h1>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>The grammar checker</p>
    </div>
  )
}
