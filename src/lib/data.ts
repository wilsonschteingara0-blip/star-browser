import type { BrowserState } from './types'
import { resetSavedState } from '../store/browser'

export function exportBrowserData(state: BrowserState) {
  const payload = {
    app: 'Star Browser',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    bookmarks: state.bookmarks,
    history: state.history,
    openTabs: state.tabs.map((tab) => ({ url: tab.url, title: tab.title, sleeping: tab.sleeping })),
    settings: state.settings,
    stats: state.stats,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `star-browser-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function eraseEverything() {
  resetSavedState()
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('star-browser:')) localStorage.removeItem(key)
  }
  window.location.reload()
}
