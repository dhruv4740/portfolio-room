import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './v3/App.jsx'
import { initAnalytics } from './v3/lib/analytics.js'

initAnalytics()
import(/* @vite-ignore */ '/os/shell/ask-pill.js').then((m) => m.mountAskPill()).catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
