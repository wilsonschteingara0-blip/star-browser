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
import { AboutPage } from './pages/AboutPage'
import { ExternalPortal } from './pages/ExternalPortal'
import { StarMark } from './components/StarMark'

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
  } = useBrowser()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const zen = state.zen

  const closePalette = useCallback(() => setPaletteOpen(false), [])

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
      if (e.key === 'Escape') {
        if (paletteOpen) {
          setPaletteOpen(false)
          return
        }
        if (zen) toggleZen()
        return
      }
      if (paletteOpen || typing) return
      if (mod || e.altKey) return

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
          hibernateWithUndo()
          break
        case 'z':
        case 'Z':
          toggleZen()
          break
        case 'b':
        case 'B':
          navigate('star://bookmarks')
          break
        case 'h':
        case 'H':
          navigate('star://history')
          break
        case ',':
          navigate('star://settings')
          break
        case 'u':
        case 'U':
          reopenLast()
          break
        case '?':
          navigate('star://about#shortcuts')
          break
        default:
          if (/^[1-9]$/.test(e.key)) {
            const tab = state.tabs[Number(e.key) - 1]
            if (tab) activateTab(tab.id)
          }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    paletteOpen,
    zen,
    state.tabs,
    newTab,
    navigate,
    hibernateWithUndo,
    toggleZen,
    activateTab,
    reopenLast,
  ])

  return (
    <div className="app" data-zen={zen}>
      <Backdrop />

      <header className="chrome">
        <div className="tabs-row">
          <Brand />
          <TabStrip />
          <div className="window-actions">
            <MemoryPill />
            <MainMenu onOpenPalette={() => setPaletteOpen(true)} />
          </div>
        </div>
        <Toolbar onOpenPalette={() => setPaletteOpen(true)} />
        {state.settings.bookmarksBar && <BookmarksBar />}
      </header>

      <main className="shell">
        <div className="viewport" ref={viewportRef}>
          <div className="viewport__inner" data-page={activeTab.kind} key={`${activeTab.id}:${activeTab.url}`}>
            <Suspense fallback={<PageFallback />}>
              <PageRouter />
            </Suspense>
          </div>
        </div>
        <StatusBar />
      </main>

      <Toasts />
      <CommandPalette open={paletteOpen} onClose={closePalette} />

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
