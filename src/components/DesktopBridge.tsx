import { useEffect, useRef } from 'react'
import { useBrowser } from '../store/browser'
import { desktop } from '../lib/desktop'
import { focusOmnibox } from '../lib/focus'
import { navController } from '../lib/navigation'

/**
 * Listens to the Chromium shell: shortcuts pressed while a guest has focus,
 * windows opened by a page, downloads, and the window's maximise state.
 * Renders nothing.
 */
export function DesktopBridge() {
  const browser = useBrowser()
  const ref = useRef(browser)
  ref.current = browser

  useEffect(() => {
    const api = desktop()
    if (!api) return

    const offOpenTab = api.onOpenTab(({ url }) => {
      if (url) ref.current.newTab(url)
    })

    const offShortcut = api.onShortcut((action) => {
      const b = ref.current
      const index = b.state.tabs.findIndex((tab) => tab.id === b.state.activeId)
      const count = b.state.tabs.length

      switch (action) {
        case 'new-tab':
          b.newTab()
          break
        case 'close-tab':
          b.closeTab(b.state.activeId)
          break
        case 'reopen-tab':
          b.reopenLast()
          break
        case 'focus-omnibox':
          focusOmnibox()
          break
        case 'toggle-palette':
          window.dispatchEvent(new Event('star:toggle-palette'))
          break
        case 'find-in-page':
          window.dispatchEvent(new Event('star:open-find'))
          break
        case 'reload':
          b.reload()
          break
        case 'hard-reload': {
          const controller = navController(b.state.activeId)
          if (controller) controller.reload(true)
          else b.reload()
          break
        }
        case 'back':
          b.back()
          break
        case 'forward':
          b.forward()
          break
        case 'next-tab': {
          const next = b.state.tabs[(index + 1) % count]
          if (next) b.activateTab(next.id)
          break
        }
        case 'prev-tab': {
          const prev = b.state.tabs[(index - 1 + count) % count]
          if (prev) b.activateTab(prev.id)
          break
        }
        default: {
          const match = /^tab-([1-9])$/.exec(action)
          if (match) {
            const target = b.state.tabs[Number(match[1]) - 1]
            if (target) b.activateTab(target.id)
          }
        }
      }
    })

    const offDownload = api.onDownload((event) => {
      if (event.phase === 'start') {
        ref.current.toast(`Downloading ${event.filename}`, { icon: 'info' })
      } else if (event.state === 'completed') {
        ref.current.toast(`Saved ${event.filename}`, { icon: 'check' })
      } else if (event.state === 'interrupted' || event.state === 'cancelled') {
        ref.current.toast(`Download ${event.state} · ${event.filename}`, { icon: 'info' })
      }
    })

    return () => {
      offOpenTab()
      offShortcut()
      offDownload()
    }
  }, [])

  return null
}
