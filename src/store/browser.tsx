import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type {
  Bookmark,
  BrowserState,
  ClosedTab,
  HistoryEntry,
  PageKind,
  Settings,
  Tab,
  ThemeId,
  Toast,
} from '../lib/types'
import { memoryBaseline, pageKind, pageTitle, STAR_SEED_BOOKMARKS, STAR_SEED_HISTORY } from '../lib/sites'
import { parseAddress } from '../lib/url'
import { memoryLabel, uid } from '../lib/utils'

const STORAGE_KEY = 'star-browser:state:v1'
const MAX_HISTORY = 400
const MAX_CLOSED = 12

export const DEFAULT_SETTINGS: Settings = {
  theme: 'midnight',
  memorySaver: true,
  autoSleepMinutes: 10,
  bookmarksBar: true,
  searchEngine: 'star',
  restoreSession: true,
  reduceMotion: false,
}

export function createTab(url = 'star://newtab', kind?: PageKind): Tab {
  return {
    id: uid('tab'),
    url,
    title: pageTitle(url),
    kind: kind ?? pageKind(url),
    sleeping: false,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    memoryMB: memoryBaseline(url),
    back: [],
    forward: [],
  }
}

function seedHistory(): HistoryEntry[] {
  const now = Date.now()
  return STAR_SEED_HISTORY.map((h) => ({
    id: uid('h'),
    url: h.url,
    title: h.title,
    visitedAt: now - h.minutesAgo * 60_000,
  }))
}

function seedBookmarks(): Bookmark[] {
  const now = Date.now()
  return STAR_SEED_BOOKMARKS.map((url) => ({
    id: uid('b'),
    url,
    title: pageTitle(url),
    addedAt: now,
  }))
}

function initialState(): BrowserState {
  const tab = createTab()
  return {
    tabs: [tab],
    activeId: tab.id,
    closed: [],
    bookmarks: seedBookmarks(),
    history: seedHistory(),
    settings: DEFAULT_SETTINGS,
    stats: { hibernated: 0, ramSavedMB: 0 },
    toasts: [],
    zen: false,
    hydrated: false,
  }
}

type Action =
  | { type: 'HYDRATE'; payload: Partial<BrowserState> | null }
  | { type: 'NEW_TAB'; url?: string }
  | { type: 'CLOSE_TAB'; id: string }
  | { type: 'CLOSE_OTHERS'; id: string }
  | { type: 'ACTIVATE'; id: string }
  | { type: 'NAVIGATE'; id: string; url: string }
  | { type: 'BACK'; id: string }
  | { type: 'FORWARD'; id: string }
  | { type: 'RELOAD'; id: string }
  | { type: 'SLEEP'; ids: string[] }
  | { type: 'WAKE'; id: string }
  | { type: 'WAKE_MANY'; ids: string[] }
  | { type: 'RESTORE_TABS'; tabs: Tab[] }
  | { type: 'TOGGLE_BOOKMARK'; url: string; title: string }
  | { type: 'REMOVE_BOOKMARK'; id: string }
  | { type: 'LOAD_BOOKMARK'; id: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'REMOVE_HISTORY'; id: string }
  | { type: 'SET_SETTINGS'; patch: Partial<Settings> }
  | { type: 'TOGGLE_ZEN' }
  | { type: 'TOAST'; toast: Toast }
  | { type: 'DISMISS_TOAST'; id: string }
  | { type: 'REOPEN_CLOSED'; id?: string }

function navigateTab(tab: Tab, url: string): Tab {
  if (tab.url === url && !tab.sleeping) return tab
  const shouldPush = tab.url && tab.url !== url
  const kind = pageKind(url)
  return {
    ...tab,
    url,
    title: pageTitle(url),
    kind,
    sleeping: false,
    lastActiveAt: Date.now(),
    memoryMB: memoryBaseline(url),
    back: shouldPush ? [...tab.back, tab.url].slice(-40) : tab.back,
    forward: [],
  }
}

function touch(tab: Tab): Tab {
  return tab.sleeping ? { ...tab, sleeping: false } : tab
}

function reducer(state: BrowserState, action: Action): BrowserState {
  switch (action.type) {
    case 'HYDRATE': {
      const saved = action.payload
      if (!saved) {
        return {
          ...state,
          settings: state.settings,
          hydrated: true,
        }
      }
      const restore = saved.settings?.restoreSession ?? DEFAULT_SETTINGS.restoreSession
      const tabs =
        restore && saved.tabs && saved.tabs.length > 0
          ? saved.tabs.map((t) => ({
              ...t,
              memoryMB: memoryBaseline(t.url),
              sleeping: false,
            }))
          : [createTab()]
      const activeId = tabs.some((t) => t.id === saved.activeId) ? (saved.activeId as string) : tabs[0].id
      return {
        ...state,
        ...saved,
        tabs,
        activeId,
        settings: { ...DEFAULT_SETTINGS, ...(saved.settings ?? {}) },
        toasts: [],
        zen: false,
        hydrated: true,
      }
    }
    case 'NEW_TAB': {
      const tab = createTab(action.url ?? 'star://newtab')
      return { ...state, tabs: [...state.tabs, tab], activeId: tab.id }
    }
    case 'CLOSE_TAB': {
      const idx = state.tabs.findIndex((t) => t.id === action.id)
      if (idx < 0) return state
      const tab = state.tabs[idx]
      const tabs = state.tabs.filter((t) => t.id !== action.id)
      const closed: ClosedTab = { url: tab.url, title: tab.title, closedAt: Date.now() }
      if (tabs.length === 0) {
        const fresh = createTab()
        return {
          ...state,
          tabs: [fresh],
          activeId: fresh.id,
          closed: [closed, ...state.closed].slice(0, MAX_CLOSED),
        }
      }
      let activeId = state.activeId
      if (state.activeId === action.id) {
        const next = tabs[Math.min(idx, tabs.length - 1)]
        activeId = next.id
      }
      return {
        ...state,
        tabs,
        activeId,
        closed: [closed, ...state.closed].slice(0, MAX_CLOSED),
      }
    }
    case 'CLOSE_OTHERS': {
      const tab = state.tabs.find((t) => t.id === action.id)
      if (!tab) return state
      const closed: ClosedTab[] = state.tabs
        .filter((t) => t.id !== action.id)
        .map((t) => ({ url: t.url, title: t.title, closedAt: Date.now() }))
      return {
        ...state,
        tabs: [tab],
        activeId: tab.id,
        closed: [...closed, ...state.closed].slice(0, MAX_CLOSED),
      }
    }
    case 'ACTIVATE': {
      if (state.activeId === action.id) return state
      return {
        ...state,
        activeId: action.id,
        tabs: state.tabs.map((t) => (t.id === action.id ? { ...touch(t), lastActiveAt: Date.now() } : t)),
      }
    }
    case 'NAVIGATE': {
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.id === action.id ? navigateTab(t, action.url) : t)),
        history: (() => {
          const target = state.tabs.find((t) => t.id === action.id)
          if (!target || target.url === action.url) return state.history
          if (
            action.url.startsWith('star://search') ||
            action.url.startsWith('star://newtab') ||
            action.url.startsWith('star://external')
          ) {
            return state.history
          }
          const entry: HistoryEntry = {
            id: uid('h'),
            url: action.url,
            title: pageTitle(action.url),
            visitedAt: Date.now(),
          }
          return [entry, ...state.history].slice(0, MAX_HISTORY)
        })(),
      }
    }
    case 'BACK': {
      return {
        ...state,
        tabs: state.tabs.map((t) => {
          if (t.id !== action.id || t.back.length === 0) return t
          const prev = t.back[t.back.length - 1]
          return {
            ...touch(t),
            url: prev,
            title: pageTitle(prev),
            kind: pageKind(prev),
            memoryMB: memoryBaseline(prev),
            back: t.back.slice(0, -1),
            forward: [t.url, ...t.forward],
          }
        }),
      }
    }
    case 'FORWARD': {
      return {
        ...state,
        tabs: state.tabs.map((t) => {
          if (t.id !== action.id || t.forward.length === 0) return t
          const next = t.forward[0]
          return {
            ...touch(t),
            url: next,
            title: pageTitle(next),
            kind: pageKind(next),
            memoryMB: memoryBaseline(next),
            back: [...t.back, t.url],
            forward: t.forward.slice(1),
          }
        }),
      }
    }
    case 'RELOAD': {
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.id === action.id ? { ...touch(t), lastActiveAt: Date.now() } : t)),
      }
    }
    case 'SLEEP': {
      const ids = new Set(action.ids)
      let saved = 0
      let count = 0
      const tabs = state.tabs.map((t) => {
        if (!ids.has(t.id) || t.sleeping || t.id === state.activeId) return t
        saved += Math.max(t.memoryMB - 9, 0)
        count += 1
        return { ...t, sleeping: true }
      })
      if (count === 0) return state
      return {
        ...state,
        tabs,
        stats: {
          hibernated: state.stats.hibernated + count,
          ramSavedMB: state.stats.ramSavedMB + Math.round(saved),
        },
      }
    }
    case 'WAKE': {
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.id === action.id ? { ...t, sleeping: false, lastActiveAt: Date.now() } : t)),
      }
    }
    case 'WAKE_MANY': {
      const ids = new Set(action.ids)
      return {
        ...state,
        tabs: state.tabs.map((t) => (ids.has(t.id) ? { ...t, sleeping: false, lastActiveAt: Date.now() } : t)),
      }
    }
    case 'RESTORE_TABS': {
      return { ...state, tabs: [...state.tabs, ...action.tabs], activeId: action.tabs[0]?.id ?? state.activeId }
    }
    case 'TOGGLE_BOOKMARK': {
      const existing = state.bookmarks.find((b) => b.url === action.url)
      if (existing) {
        return { ...state, bookmarks: state.bookmarks.filter((b) => b.id !== existing.id) }
      }
      const bookmark: Bookmark = {
        id: uid('b'),
        url: action.url,
        title: action.title,
        addedAt: Date.now(),
      }
      return { ...state, bookmarks: [bookmark, ...state.bookmarks] }
    }
    case 'REMOVE_BOOKMARK': {
      return { ...state, bookmarks: state.bookmarks.filter((b) => b.id !== action.id) }
    }
    case 'LOAD_BOOKMARK': {
      const bookmark = state.bookmarks.find((b) => b.id === action.id)
      if (!bookmark) return state
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.id === state.activeId ? navigateTab(t, bookmark.url) : t)),
        history: [
          { id: uid('h'), url: bookmark.url, title: bookmark.title, visitedAt: Date.now() },
          ...state.history,
        ].slice(0, MAX_HISTORY),
      }
    }
    case 'CLEAR_HISTORY': {
      return { ...state, history: [] }
    }
    case 'REMOVE_HISTORY': {
      return { ...state, history: state.history.filter((h) => h.id !== action.id) }
    }
    case 'SET_SETTINGS': {
      return { ...state, settings: { ...state.settings, ...action.patch } }
    }
    case 'TOGGLE_ZEN': {
      return { ...state, zen: !state.zen }
    }
    case 'TOAST': {
      return { ...state, toasts: [...state.toasts.slice(-2), action.toast] }
    }
    case 'DISMISS_TOAST': {
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    }
    case 'REOPEN_CLOSED': {
      const target = action.id ? state.closed.find((c) => c.title === action.id || c.url === action.id) : state.closed[0]
      if (!target) return state
      const tab = createTab(target.url)
      return {
        ...state,
        tabs: [...state.tabs, tab],
        activeId: tab.id,
        closed: target === state.closed[0] && !action.id ? state.closed.slice(1) : state.closed,
      }
    }
    default:
      return state
  }
}

function sanitize(saved: Partial<BrowserState> | null): Partial<BrowserState> | null {
  if (!saved) return null
  return saved
}

function loadPersisted(): Partial<BrowserState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return sanitize(JSON.parse(raw) as Partial<BrowserState>)
  } catch {
    return null
  }
}

export interface BrowserApi {
  state: BrowserState
  activeTab: Tab
  activeIndex: number
  openUrl: (raw: string, opts?: { background?: boolean }) => void
  navigate: (raw: string) => void
  back: () => void
  forward: () => void
  reload: () => void
  closeTab: (id: string) => void
  activateTab: (id: string) => void
  newTab: (url?: string) => void
  closeOthers: (id: string) => void
  sleepTab: (id: string) => void
  wakeTabs: (ids: string[]) => void
  restoreTabs: (tabs: Tab[]) => void
  hibernateWithUndo: () => void
  wakeTab: (id: string) => void
  hibernateAll: () => void
  hibernateInactive: (silent?: boolean) => void
  toggleBookmark: (url?: string, title?: string) => void
  isBookmarked: (url: string) => boolean
  updateSettings: (patch: Partial<Settings>) => void
  setTheme: (theme: ThemeId) => void
  toggleZen: () => void
  toast: (message: string, opts?: Partial<Omit<Toast, 'id' | 'message' | 'createdAt'>>) => void
  dismissToast: (id: string) => void
  reopenLast: () => void
  clearHistory: () => void
  removeHistory: (id: string) => void
  removeBookmark: (id: string) => void
  toTab: (tab: Tab) => void
}

const BrowserContext = createContext<BrowserApi | null>(null)

export function BrowserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const saved = loadPersisted()
    dispatch({ type: 'HYDRATE', payload: saved })
  }, [])

  useEffect(() => {
    if (!state.hydrated) return
    const payload: Partial<BrowserState> = {
      tabs: state.tabs,
      activeId: state.activeId,
      closed: state.closed,
      bookmarks: state.bookmarks,
      history: state.history,
      settings: state.settings,
      stats: state.stats,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      /* storage full or blocked — Star keeps browsing */
    }
  }, [state.hydrated, state.tabs, state.activeId, state.closed, state.bookmarks, state.history, state.settings, state.stats])

  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme
    document.documentElement.dataset.motion = state.settings.reduceMotion ? 'reduced' : 'full'
  }, [state.settings.theme, state.settings.reduceMotion])

  const toast = useCallback<BrowserApi['toast']>((message, opts) => {
    const t: Toast = {
      id: uid('toast'),
      message,
      createdAt: Date.now(),
      ...opts,
    }
    dispatch({ type: 'TOAST', toast: t })
    window.setTimeout(() => {
      dispatch({ type: 'DISMISS_TOAST', id: t.id })
    }, 6000)
  }, [])

  const navigate = useCallback(
    (raw: string) => {
      const parsed = parseAddress(raw)
      const active = stateRef.current.tabs.find((t) => t.id === stateRef.current.activeId)
      if (!active) return
      dispatch({ type: 'NAVIGATE', id: active.id, url: parsed.url })
    },
    [],
  )

  const openUrl = useCallback<BrowserApi['openUrl']>((raw, opts) => {
    const parsed = parseAddress(raw)
    if (opts?.background) {
      const tab = createTab(parsed.url, parsed.mode === 'search' ? 'search' : undefined)
      dispatch({ type: 'NEW_TAB', url: parsed.url })
      void tab
      return
    }
    dispatch({ type: 'NAVIGATE', id: stateRef.current.activeId, url: parsed.url })
  }, [])

  const newTab = useCallback((url?: string) => {
    dispatch({ type: 'NEW_TAB', url })
  }, [])

  const hibernateInactive = useCallback(
    (silent = false) => {
      const s = stateRef.current
      const candidates = s.tabs.filter(
        (t) => t.id !== s.activeId && !t.sleeping && t.kind !== 'internal',
      )
      if (candidates.length === 0) {
        if (!silent) toast('Nothing to hibernate — the other tabs are already resting.', { icon: 'moon' })
        return
      }
      const freed = candidates.reduce((acc, t) => acc + Math.max(t.memoryMB - 9, 0), 0)
      dispatch({ type: 'SLEEP', ids: candidates.map((t) => t.id) })
      toast(
        `${candidates.length} ${candidates.length === 1 ? 'tab' : 'tabs'} hibernated · ${memoryLabel(freed)} freed`,
        { icon: 'moon', actionLabel: 'Manage tabs', actionUrl: 'star://settings#memory' },
      )
    },
    [toast],
  )

  // Auto-hibernation worker
  useEffect(() => {
    if (!state.settings.memorySaver) return
    const every = window.setInterval(() => {
      const s = stateRef.current
      const threshold = s.settings.autoSleepMinutes * 60_000
      const now = Date.now()
      const ids = s.tabs
        .filter(
          (t) =>
            t.id !== s.activeId &&
            !t.sleeping &&
            t.kind !== 'internal' &&
            now - t.lastActiveAt > threshold,
        )
        .map((t) => t.id)
      if (ids.length > 0) {
        dispatch({ type: 'SLEEP', ids })
        toast(
          `${ids.length} ${ids.length === 1 ? 'tab' : 'tabs'} drifted off to save memory`,
          { icon: 'moon', actionLabel: 'Undo', undo: { type: 'hibernate', ids } },
        )
      }
    }, 20_000)
    return () => window.clearInterval(every)
  }, [state.settings.memorySaver, state.settings.autoSleepMinutes, toast])

  const hibernateWithUndo = useCallback(() => {
    const s = stateRef.current
    const candidates = s.tabs.filter(
      (t) => t.id !== s.activeId && !t.sleeping && t.kind !== 'internal',
    )
    if (candidates.length === 0) {
      toast('Nothing to hibernate — the other tabs are already resting.', { icon: 'moon' })
      return
    }
    const freed = candidates.reduce((acc, t) => acc + Math.max(t.memoryMB - 9, 0), 0)
    const ids = candidates.map((t) => t.id)
    dispatch({ type: 'SLEEP', ids })
    toast(
      `${ids.length} ${ids.length === 1 ? 'tab' : 'tabs'} hibernated · ${memoryLabel(freed)} freed`,
      { icon: 'moon', actionLabel: 'Undo', undo: { type: 'hibernate', ids } },
    )
  }, [toast])

  const toggleBookmark = useCallback<BrowserApi['toggleBookmark']>(
    (url, title) => {
      const s = stateRef.current
      const target = url ?? s.tabs.find((t) => t.id === s.activeId)?.url ?? 'star://newtab'
      const label = title ?? pageTitle(target)
      const exists = s.bookmarks.some((b) => b.url === target)
      dispatch({ type: 'TOGGLE_BOOKMARK', url: target, title: label })
      toast(exists ? 'Removed from bookmarks' : 'Added to bookmarks', {
        icon: 'star',
        actionLabel: exists ? undefined : 'View all',
        actionUrl: exists ? undefined : 'star://bookmarks',
      })
    },
    [toast],
  )

  const updateSettings = useCallback<BrowserApi['updateSettings']>((patch) => {
    dispatch({ type: 'SET_SETTINGS', patch })
  }, [])

  const api = useMemo<BrowserApi>(() => {
    const activeTab = state.tabs.find((t) => t.id === state.activeId) ?? state.tabs[0]
    const activeIndex = Math.max(0, state.tabs.findIndex((t) => t.id === activeTab.id))
    return {
      state,
      activeTab,
      activeIndex,
      openUrl,
      navigate,
      back: () => dispatch({ type: 'BACK', id: state.activeId }),
      forward: () => dispatch({ type: 'FORWARD', id: state.activeId }),
      reload: () => dispatch({ type: 'RELOAD', id: state.activeId }),
      closeTab: (id) => dispatch({ type: 'CLOSE_TAB', id }),
      activateTab: (id) => dispatch({ type: 'ACTIVATE', id }),
      newTab,
      closeOthers: (id) => dispatch({ type: 'CLOSE_OTHERS', id }),
      sleepTab: (id) => dispatch({ type: 'SLEEP', ids: [id] }),
      wakeTabs: (ids) => dispatch({ type: 'WAKE_MANY', ids }),
      restoreTabs: (tabs) => dispatch({ type: 'RESTORE_TABS', tabs }),
      wakeTab: (id) => dispatch({ type: 'WAKE', id }),
      hibernateAll: () => hibernateInactive(),
      hibernateInactive,
      hibernateWithUndo: () => hibernateWithUndo(),
      toggleBookmark,
      isBookmarked: (url) => state.bookmarks.some((b) => b.url === url),
      updateSettings,
      setTheme: (theme) => updateSettings({ theme }),
      toggleZen: () => dispatch({ type: 'TOGGLE_ZEN' }),
      toast,
      dismissToast: (id) => dispatch({ type: 'DISMISS_TOAST', id }),
      reopenLast: () => dispatch({ type: 'REOPEN_CLOSED' }),
      clearHistory: () => dispatch({ type: 'CLEAR_HISTORY' }),
      removeHistory: (id) => dispatch({ type: 'REMOVE_HISTORY', id }),
      removeBookmark: (id) => dispatch({ type: 'REMOVE_BOOKMARK', id }),
      toTab: (tab) => dispatch({ type: 'ACTIVATE', id: tab.id }),
    }
  }, [state, openUrl, navigate, newTab, hibernateInactive, hibernateWithUndo, toggleBookmark, updateSettings, toast])

  return <BrowserContext.Provider value={api}>{children}</BrowserContext.Provider>
}

export function useBrowser(): BrowserApi {
  const ctx = useContext(BrowserContext)
  if (!ctx) throw new Error('useBrowser must be used inside <BrowserProvider>')
  return ctx
}

export function resetSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
