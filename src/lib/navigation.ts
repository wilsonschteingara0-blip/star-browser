import type { Tab } from './types'
import { isDesktop } from './desktop'

/**
 * A page's real navigation lives inside Chromium, not in React state. Each
 * mounted webview registers a controller here so the toolbar can drive the
 * guest's own history instead of the tab model's bookkeeping.
 */
export interface NavController {
  back: () => void
  forward: () => void
  reload: (ignoreCache?: boolean) => void
  stop: () => void
  canGoBack: () => boolean
  canGoForward: () => boolean
  find: (text: string, options?: { forward?: boolean; findNext?: boolean }) => void
  stopFind: (action: 'clearSelection' | 'keepSelection' | 'activateSelection') => void
}

const controllers = new Map<string, NavController>()

export function registerNavController(tabId: string, controller: NavController): () => void {
  controllers.set(tabId, controller)
  return () => {
    if (controllers.get(tabId) === controller) controllers.delete(tabId)
  }
}

export function navController(tabId: string): NavController | undefined {
  return controllers.get(tabId)
}

/** True when the toolbar arrow should be clickable for this tab. */
export function canGoBack(tab: Tab): boolean {
  if (tab.sleeping) return false
  if (isDesktop() && tab.kind === 'external') return tab.canBack === true
  return tab.back.length > 0
}

export function canGoForward(tab: Tab): boolean {
  if (tab.sleeping) return false
  if (isDesktop() && tab.kind === 'external') return tab.canForward === true
  return tab.forward.length > 0
}
