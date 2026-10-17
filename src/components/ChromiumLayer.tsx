import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Copy, ExternalLink, RefreshCw, ShieldAlert, WifiOff } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { desktop, isDesktop, openExternalUrl } from '../lib/desktop'
import { registerNavController } from '../lib/navigation'
import { pageTitle } from '../lib/sites'
import type { Tab } from '../lib/types'

/* The bits of the <webview> element API that Star actually uses. */
interface ElectronWebview extends HTMLElement {
  getURL: () => string
  getTitle: () => string
  canGoBack: () => boolean
  canGoForward: () => boolean
  goBack: () => void
  goForward: () => void
  reload: () => void
  reloadIgnoringCache: () => void
  stop: () => void
  loadURL: (url: string) => Promise<void>
  getWebContentsId: () => number
  isCurrentlyAudible: () => boolean
  findInPage: (
    text: string,
    options?: { forward?: boolean; findNext?: boolean },
  ) => number
  stopFindInPage: (action: 'clearSelection' | 'keepSelection' | 'activateSelection') => void
  focus: () => void
  blur: () => void
}

type WebviewEvent = Event & {
  url?: string
  title?: string
  favicons?: string[]
  errorCode?: number
  errorDescription?: string
  validatedURL?: string
  isMainFrame?: boolean
  details?: { reason?: string }
  result?: { matches: number; activeMatchOrdinal: number }
}

interface Failure {
  code: number | string
  description: string
  url: string
}

function call<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch {
    return undefined
  }
}

/**
 * One real Chromium page. Mounting this creates a sandboxed guest renderer;
 * unmounting (tab closed or hibernated) destroys it — which is the entire
 * memory story, made literal.
 */
function WebSurface({ tab, active }: { tab: Tab; active: boolean }) {
  const browser = useBrowser()
  const apiRef = useRef(browser)
  apiRef.current = browser

  const mountRef = useRef<HTMLDivElement>(null)
  const webviewRef = useRef<ElectronWebview | null>(null)
  const lastLoadedRef = useRef(tab.url)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [guestId, setGuestId] = useState<number | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  /* Create the guest once per tab. tab.url changes are applied below. */
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const webview = document.createElement('webview') as ElectronWebview
    webview.className = 'chromium-view'
    webview.setAttribute('src', lastLoadedRef.current)
    webview.setAttribute('partition', 'persist:star')
    webview.setAttribute('webpreferences', 'contextIsolation=yes,sandbox=yes')
    // New windows are intercepted in the main process and become Star tabs.
    webview.setAttribute('allowpopups', '')
    webview.style.width = '100%'
    webview.style.height = '100%'
    webviewRef.current = webview

    const report = () => {
      const url = call(() => webview.getURL())
      if (!url || !/^https?:/i.test(url)) return
      lastLoadedRef.current = url
      const title = call(() => webview.getTitle()) || pageTitle(url)
      apiRef.current.syncTab(tab.id, {
        url,
        title,
        canBack: call(() => webview.canGoBack()) ?? false,
        canForward: call(() => webview.canGoForward()) ?? false,
      })
      const id = call(() => webview.getWebContentsId())
      if (typeof id === 'number') setGuestId(id)
    }

    const onStart = () => {
      setLoading(true)
      setFailure(null)
    }
    const onStop = () => {
      setLoading(false)
      report()
    }
    const onNavigate = () => {
      setFailure(null)
      report()
    }
    const onTitle = (event: Event) => {
      const title = (event as WebviewEvent).title
      if (title) apiRef.current.syncTab(tab.id, { title })
    }
    const onFavicon = (event: Event) => {
      const favicons = (event as WebviewEvent).favicons
      if (favicons && favicons[0]) apiRef.current.syncTab(tab.id, { favicon: favicons[0] })
    }
    const onFail = (event: Event) => {
      const e = event as WebviewEvent
      if (e.errorCode === -3 || e.errorCode === 0) return // aborted / not a failure
      if (e.isMainFrame === false) return
      setLoading(false)
      setFailure({
        code: e.errorCode ?? 'ERR',
        description: e.errorDescription || 'This page could not be loaded.',
        url: e.validatedURL || tab.url,
      })
    }
    const onGone = () => {
      setLoading(false)
      setFailure({
        code: 'GONE',
        description: "This page's Chromium process stopped.",
        url: lastLoadedRef.current,
      })
    }
    const onEnterFullscreen = () => setFullscreen(true)
    const onLeaveFullscreen = () => setFullscreen(false)
    const onFound = (event: Event) => {
      const result = (event as WebviewEvent).result
      if (!result) return
      window.dispatchEvent(
        new CustomEvent('star:find-result', {
          detail: {
            tabId: tab.id,
            matches: result.matches,
            activeMatchOrdinal: result.activeMatchOrdinal,
          },
        }),
      )
    }

    webview.addEventListener('dom-ready', report)
    webview.addEventListener('did-start-loading', onStart)
    webview.addEventListener('did-stop-loading', onStop)
    webview.addEventListener('did-navigate', onNavigate)
    webview.addEventListener('did-navigate-in-page', onNavigate)
    webview.addEventListener('page-title-updated', onTitle)
    webview.addEventListener('page-favicon-updated', onFavicon)
    webview.addEventListener('did-fail-load', onFail)
    webview.addEventListener('render-process-gone', onGone)
    webview.addEventListener('crashed', onGone)
    webview.addEventListener('enter-html-full-screen', onEnterFullscreen)
    webview.addEventListener('leave-html-full-screen', onLeaveFullscreen)
    webview.addEventListener('found-in-page', onFound)

    mount.appendChild(webview)

    return () => {
      webview.removeEventListener('dom-ready', report)
      webview.removeEventListener('did-start-loading', onStart)
      webview.removeEventListener('did-stop-loading', onStop)
      webview.removeEventListener('did-navigate', onNavigate)
      webview.removeEventListener('did-navigate-in-page', onNavigate)
      webview.removeEventListener('page-title-updated', onTitle)
      webview.removeEventListener('page-favicon-updated', onFavicon)
      webview.removeEventListener('did-fail-load', onFail)
      webview.removeEventListener('render-process-gone', onGone)
      webview.removeEventListener('crashed', onGone)
      webview.removeEventListener('enter-html-full-screen', onEnterFullscreen)
      webview.removeEventListener('leave-html-full-screen', onLeaveFullscreen)
      webview.removeEventListener('found-in-page', onFound)
      webviewRef.current = null
      // Removing the guest is what frees the renderer process.
      webview.remove()
    }
  }, [tab.id])

  /* The toolbar drives Chromium's real history, not a model of it. */
  useEffect(() => {
    return registerNavController(tab.id, {
      back: () => call(() => webviewRef.current?.goBack()),
      forward: () => call(() => webviewRef.current?.goForward()),
      reload: (ignoreCache) =>
        call(() => {
          const wv = webviewRef.current
          if (!wv) return
          if (ignoreCache) wv.reloadIgnoringCache()
          else wv.reload()
        }),
      stop: () => call(() => webviewRef.current?.stop()),
      canGoBack: () => call(() => webviewRef.current?.canGoBack()) ?? false,
      canGoForward: () => call(() => webviewRef.current?.canGoForward()) ?? false,
      find: (text, options) =>
        call(() => webviewRef.current?.findInPage(text, options)),
      stopFind: (action) => call(() => webviewRef.current?.stopFindInPage(action)),
    })
  }, [tab.id])

  /* Typing an address in the omnibox navigates this guest. */
  useEffect(() => {
    if (tab.url === lastLoadedRef.current) return
    lastLoadedRef.current = tab.url
    const webview = webviewRef.current
    if (!webview) return
    if (call(() => webview.getURL()) === tab.url) return
    setFailure(null)
    setLoading(true)
    void call(() => webview.loadURL(tab.url))?.catch(() => {
      /* aborted navigations surface through did-fail-load */
    })
  }, [tab.url])

  /* Measure the guest's real memory, so the panel is not a model here. */
  useEffect(() => {
    const api = desktop()
    if (!api || guestId === null) return
    let alive = true
    const measure = async () => {
      // Audio keeps a tab awake, like Chrome's own memory saver.
      if (call(() => webviewRef.current?.isCurrentlyAudible())) {
        apiRef.current.syncTab(tab.id, { lastActiveAt: Date.now() })
      }
      const info = await api.guestMemory(guestId).catch(() => null)
      if (!alive || !info) return
      const mb = Math.round(info.residentSet / 1024)
      if (mb > 0) apiRef.current.syncTab(tab.id, { memoryMB: Math.min(Math.max(mb, 8), 8192) })
    }
    void measure()
    const timer = window.setInterval(() => void measure(), 8000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [guestId, tab.id])

  useEffect(() => {
    if (!active) call(() => webviewRef.current?.blur())
  }, [active])

  const retry = () => {
    setFailure(null)
    setLoading(true)
    call(() => webviewRef.current?.reload())
  }

  return (
    <div
      className="chromium-host"
      data-active={active}
      data-fullscreen={fullscreen}
      aria-hidden={!active}
    >
      <div className="chromium-mount" ref={mountRef} />
      {loading && !failure && <div className="chromium-progress" aria-hidden="true" />}
      {failure && (
        <div className="chromium-fail">
          <div className="chromium-fail__card">
            <span className="chromium-fail__icon">
              {failure.code === 'GONE' ? <ShieldAlert size={22} /> : <WifiOff size={22} />}
            </span>
            <div className="chromium-fail__eyebrow">Chromium could not load this page</div>
            <h2>{failure.code === 'GONE' ? 'That renderer left the orbit' : 'No signal from this address'}</h2>
            <p>{failure.description}</p>
            <code>{failure.url}</code>
            <div className="chromium-fail__actions">
              <button className="btn btn--primary btn--sm" onClick={retry}>
                <RefreshCw size={12} /> Try again
              </button>
              <button className="btn btn--sm" onClick={() => openExternalUrl(failure.url)}>
                <ExternalLink size={12} /> Open in system browser
              </button>
              <button
                className="btn btn--sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(failure.url)
                  } catch {
                    /* clipboard can be blocked; the address is visible above */
                  }
                }}
              >
                <Copy size={12} /> Copy address
              </button>
            </div>
            <div className="chromium-fail__hint">
              <AlertTriangle size={11} /> The address bar still works — press{' '}
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>L</kbd> to try somewhere else.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * The Chromium layer sits above the Star pages. Every awake external tab keeps
 * its own guest alive; switching tabs only changes which surface is visible.
 */
export function ChromiumLayer() {
  const { state } = useBrowser()
  if (!isDesktop()) return null

  const tabs = state.tabs.filter(
    (tab) => tab.kind === 'external' && !tab.sleeping && /^https?:/i.test(tab.url),
  )

  return (
    <div className="chromium-layer">
      {tabs.map((tab) => (
        <WebSurface key={tab.id} tab={tab} active={tab.id === state.activeId} />
      ))}
    </div>
  )
}
