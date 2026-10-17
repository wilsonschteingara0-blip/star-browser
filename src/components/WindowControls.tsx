import { useEffect, useState } from 'react'
import { Maximize2, Minimize2, Minus, X } from 'lucide-react'
import { desktop } from '../lib/desktop'

/** Custom titlebar buttons — the Chromium window is frameless. */
export function WindowControls() {
  const api = desktop()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    if (!api) return
    let alive = true
    void api.window
      .isMaximized()
      .then((value) => {
        if (alive) setMaximized(value)
      })
      .catch(() => {
        /* window is closing */
      })
    const unsubscribe = api.onWindowState((value) => setMaximized(value))
    return () => {
      alive = false
      unsubscribe()
    }
  }, [api])

  if (!api) return null

  return (
    <div className="window-controls" data-platform={api.platform}>
      <button
        className="window-control"
        aria-label="Minimize window"
        title="Minimize"
        onClick={() => void api.window.minimize()}
      >
        <Minus size={13} />
      </button>
      <button
        className="window-control"
        aria-label={maximized ? 'Restore window' : 'Maximize window'}
        title={maximized ? 'Restore' : 'Maximize'}
        onClick={() => void api.window.toggleMaximize()}
      >
        {maximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
      </button>
      <button
        className="window-control window-control--close"
        aria-label="Close window"
        title="Close"
        onClick={() => void api.window.close()}
      >
        <X size={13} />
      </button>
    </div>
  )
}
