import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useBrowser } from './store/browser'
import { Backdrop } from './components/Backdrop'
import { Brand, TabStrip } from './components/Tabs'
import { Toolbar } from './components/Toolbar'
import { BookmarksBar } from './components/BookmarksBar'
import { StatusBar } from './components/StatusBar'
import { Toasts } from './components/Toasts'
import { CommandPalette } from './components/CommandPalette'
import { MemoryPill } from './components/MemoryPanel'
import { MainMenu } from './components/MainMenu'
import { focusOmnibox } from './lib/focus'
import { siteByUrl } from './lib/sites'
import { NewTab } from './pages/NewTab'
import { SearchPage } from './pages/SearchPage'
import { HistoryPage } from './pages/HistoryPage'
import { BookmarksPage } from './pages/BookmarksPage'
import { SettingsPage } from './pages/SettingsPage'
import { DocsPage } from './pages/DocsPage'
import { ChromiumPage } from './pages/ChromiumPage'
import { AboutPage } from './pages/AboutPage'
import { ExternalPortal } from './pages/ExternalPortal'
import { StarMark } from './components/StarMark'
import { ChromiumLayer } from './components/ChromiumLayer'
import { WindowControls } from './components/WindowControls'
import { DesktopBridge } from './components/DesktopBridge'
import { FindBar } from './components/FindBar'
import { desktop, isDesktop } from './lib/desktop'
import { navController } from './lib/navigation'

// The constellation apps carry real weight (canvas, Web Audio, editors), so
// they are split out and fetched the first time you open them. The shell
// stays small; a page you never visit costs nothing.
const NotesApp = lazy(() => import('./apps/NotesApp').then((m) => ({ default: m.NotesApp })))
const MailApp = lazy(() => import('./apps/MailApp').then((m) => ({ default: m.MailApp })))
const CometGame = lazy(() => import('./apps/CometGame').then((m) => ({ default: m.CometGame })))
const RadioApp = lazy(() => import('./apps/RadioApp').then((m) => ({ default: m.RadioApp })))
const SkyApp = lazy(() => import('./apps/SkyApp').then((m) => ({ default: m.SkyApp })))

function PageFallback() {
  return (
    <div className="page-fallback">
      <StarMark size={26} gradient />
      <span>Bringing this star into view…</span>
    </div>
  )
}

function PageRouter() {
  const { activeTab } = useBrowser()
  const url = activeTab.url

  if (url.startsWith('star://search')) return <SearchPage />
  if (url.startsWith('star://external')) return <ExternalPortal url={url} />
  if (url.startsWith('star://chromium')) return <ChromiumPage />
  if (url.startsWith('star://settings')) return <SettingsPage url={url} />
  if (url.startsWith('star://history')) return <HistoryPage />
  if (url.startsWith('star://bookmarks')) return <BookmarksPage />
  if (url.startsWith('star://about')) return <AboutPage />
  if (url.startsWith('star://newtab') || url === 'star://') return <NewTab />

  const site = siteByUrl(url)
  if (site) {
    switch (site.id) {
      case 'notes':
        return <NotesApp />
      case 'mail':
        return <MailApp />
      case 'comet':
        return <CometGame />
      case 'radio':
        return <RadioApp />
      case 'sky':
        return <SkyApp />
      case 'docs':
        return <DocsPage />
      default:
        break
    }
  }

  return <ExternalPortal url={url} />
}

export default function App() {
  const {
    state,
    activeTab,
    newTab,
    navigate,
    hibernateWithUndo,
    toggleZen,
    activateTab,
    reopenLast,
    closeTab,
    reload,
    back,
    forward,
  } = useBrowser()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const zen = state.zen
  const nativeWeb =
    isDesktop() && activeTab.kind === 'external' && /^https?:/i.test(activeTab.url)

  const closePalette = useCallback(() => setPaletteOpen(false), [])

  // The Chromium shell forwards shortcuts pressed inside a guest page here.
  useEffect(() => {
    const toggle = () => setPaletteOpen((open) => !open)
    const openFind = () => setFindOpen(true)
    window.addEventListener('star:toggle-palette', toggle)
    window.addEventListener('star:open-find', openFind)
    return () => {
      window.removeEventListener('star:toggle-palette', toggle)
      window.removeEventListener('star:open-find', openFind)
    }
  }, [])

  // The find bar belongs to a Chromium page, not to Star's own pages.
  useEffect(() => {
    if (!nativeWeb) setFindOpen(false)
  }, [nativeWeb, activeTab.id])

  // A freshly opened tab puts the cursor in the address bar, like a real
  // browser. The page's own search field is there for anyone who clicks it.
  useEffect(() => {
    if (activeTab.url.startsWith('star://newtab') && Date.now() - activeTab.createdAt < 1500) {
      focusOmnibox()
    }
  }, [activeTab.id, activeTab.url, activeTab.createdAt])

  // Like a real browser: the window title follows the page.
  useEffect(() => {
    document.title = activeTab.title ? `${activeTab.title} · Star Browser` : 'Star Browser'
  }, [activeTab.title])

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    const hash = activeTab.url.split('#')[1]
    if (hash) {
      const timer = window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 160)
      return () => window.clearTimeout(timer)
    }
  }, [activeTab.url, activeTab.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing = !!target?.closest('input, textarea, select, [contenteditable="true"]')
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((open) => !open)
        return
      }
      if (mod && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        focusOmnibox()
        return
      }

      // Chromium-shell shortcuts when the Star chrome itself has focus.
      // (Inside a page, the main process forwards these same actions.)
      if (isDesktop() && !e.repeat) {
        const lower = e.key.toLowerCase()
        if (mod && lower === 't') {
          e.preventDefault()
          if (e.shiftKey) reopenLast()
          else newTab()
          return
        }
        if (mod && lower === 'w') {
          e.preventDefault()
          closeTab(activeTab.id)
          return
        }
        if (mod && lower === 'f') {
          if (nativeWeb) {
            e.preventDefault()
            setFindOpen(true)
          }
          return
        }
        if (mod && lower === 'r') {
          e.preventDefault()
          const controller = navController(activeTab.id)
          if (controller) controller.reload(e.shiftKey)
          else reload()
          return
        }
        if (mod && e.key === 'Tab') {
          e.preventDefault()
          if (state.tabs.length > 1) {
            const index = state.tabs.findIndex((tab) => tab.id === activeTab.id)
            const step = e.shiftKey ? -1 : 1
            const next = state.tabs[(index + step + state.tabs.length) % state.tabs.length]
            if (next) activateTab(next.id)
          }
          return
        }
        if (mod && /^[1-9]$/.test(e.key)) {
          e.preventDefault()
          const target = state.tabs[Number(e.key) - 1]
          if (target) activateTab(target.id)
          return
        }
        if (e.altKey && e.key === 'ArrowLeft') {
          e.preventDefault()
          back()
          return
        }
        if (e.altKey && e.key === 'ArrowRight') {
          e.preventDefault()
          forward()
          return
        }
        if (e.key === 'F5') {
          e.preventDefault()
          reload()
          return
        }
      }

      if (e.key === 'Escape') {
        if (findOpen) {
          setFindOpen(false)
          return
        }
        if (paletteOpen) {
          setPaletteOpen(false)
          return
        }
        if (zen) toggleZen()
        return
      }
      if (paletteOpen || typing) return
      if (mod || e.altKey || e.repeat) return

      // Prevent the default action for every key we handle, otherwise the
      // character can be inserted into an input that has just been focused.
      switch (e.key) {
        case '/':
          e.preventDefault()
          focusOmnibox()
          break
        case 't':
        case 'T':
          e.preventDefault()
          newTab()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          hibernateWithUndo()
          break
        case 'z':
        case 'Z':
          e.preventDefault()
          toggleZen()
          break
        case 'b':
        case 'B':
          e.preventDefault()
          navigate('star://bookmarks')
          break
        case 'h':
        case 'H':
          e.preventDefault()
          navigate('star://history')
          break
        case ',':
          e.preventDefault()
          navigate('star://settings')
          break
        case 'u':
        case 'U':
          e.preventDefault()
          reopenLast()
          break
        case '?':
          e.preventDefault()
          navigate('star://about#shortcuts')
          break
        default:
          if (/^[1-9]$/.test(e.key)) {
            e.preventDefault()
            const tab = state.tabs[Number(e.key) - 1]
            if (tab) activateTab(tab.id)
          }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    paletteOpen,
    findOpen,
    nativeWeb,
    zen,
    state.tabs,
    newTab,
    navigate,
    hibernateWithUndo,
    toggleZen,
    activateTab,
    reopenLast,
    closeTab,
    reload,
    back,
    forward,
    activeTab.id,
  ])

  return (
    <div className="app" data-zen={zen} data-desktop={isDesktop()}>
      <Backdrop />

      <header className="chrome">
        <div
          className="tabs-row"
          onDoubleClick={(event) => {
            if (!isDesktop()) return
            const target = event.target as HTMLElement
            if (target.closest('button, input, select, .tab, .memory-pill, .window-controls')) return
            void desktop()?.window.toggleMaximize()
          }}
        >
          <Brand />
          <TabStrip />
          <div className="window-actions">
            <MemoryPill />
            <MainMenu onOpenPalette={() => setPaletteOpen(true)} />
            <WindowControls />
          </div>
        </div>
        <Toolbar onOpenPalette={() => setPaletteOpen(true)} />
        {state.settings.bookmarksBar && <BookmarksBar />}
      </header>

      <main className="shell">
        <div className="viewport" ref={viewportRef} data-native={nativeWeb}>
          {!nativeWeb && (
            <div className="viewport__inner" data-page={activeTab.kind} key={`${activeTab.id}:${activeTab.url}`}>
              <Suspense fallback={<PageFallback />}>
                <PageRouter />
              </Suspense>
            </div>
          )}
          <ChromiumLayer />
          {findOpen && nativeWeb && <FindBar onClose={() => setFindOpen(false)} />}
        </div>
        <StatusBar />
      </main>

      <Toasts />
      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <DesktopBridge />

      {zen && (
        <div className="zen-hint">
          <Sparkles size={13} color="var(--gold)" />
          <span>
            <strong>Zen mode.</strong> Just the page and you.
          </span>
          <button className="zen-hint__exit" onClick={toggleZen}>
            <X size={10} /> Esc to exit
          </button>
        </div>
      )}
    </div>
  )
}
