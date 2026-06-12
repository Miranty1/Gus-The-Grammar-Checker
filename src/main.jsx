import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Consume every wheel event the inner text boxes can't scroll. preventDefault
// stops the scroll pipeline before Chromium's compositor runs, which is the
// only guaranteed way to keep macOS trackpad rubber-banding from bouncing the
// whole panel (CSS overscroll-behavior and the ElasticOverscroll feature flag
// both act too late for native momentum gestures).
document.addEventListener('wheel', (e) => {
  // No horizontal scrollers exist in this UI
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    e.preventDefault()
    return
  }
  let el = e.target instanceof Element ? e.target : null
  while (el && el !== document.body) {
    if (el.scrollHeight > el.clientHeight + 1) {
      const overflowY = getComputedStyle(el).overflowY
      if (overflowY === 'auto' || overflowY === 'scroll') {
        const canConsume = e.deltaY < 0
          ? el.scrollTop > 0
          : el.scrollTop + el.clientHeight < el.scrollHeight - 1
        if (canConsume) return // let the box scroll natively
      }
    }
    el = el.parentElement
  }
  e.preventDefault() // nothing can take this scroll: never let it reach the document
}, { passive: false })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
