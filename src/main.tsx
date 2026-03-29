import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// StrictMode removed: it causes double-mount/unmount of effects which
// exposes false timing bugs in the R3F game loop (ref null-checks).
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
