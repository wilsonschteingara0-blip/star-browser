export type ThemeId = 'midnight' | 'eclipse' | 'daylight'
export type SearchEngineId = 'star' | 'google' | 'duckduckgo' | 'bing'
export type PageKind = 'internal' | 'site' | 'search' | 'external'

export interface Tab {
  id: string
  url: string
  title: string
  kind: PageKind
  sleeping: boolean
  createdAt: number
  lastActiveAt: number
  memoryMB: number
  /** Real favicon reported by Chromium, when a web page is open. */
  favicon?: string
  /** Live Chromium history state for external pages in the desktop app. */
  canBack?: boolean
  canForward?: boolean
  back: string[]
  forward: string[]
}

export interface HistoryEntry {
  id: string
  url: string
  title: string
  visitedAt: number
}

export interface Bookmark {
  id: string
  url: string
  title: string
  addedAt: number
}

export interface Settings {
  theme: ThemeId
  memorySaver: boolean
  autoSleepMinutes: number
  bookmarksBar: boolean
  searchEngine: SearchEngineId
  restoreSession: boolean
  reduceMotion: boolean
}

export interface Toast {
  id: string
  message: string
  icon?: 'star' | 'moon' | 'check' | 'info'
  actionLabel?: string
  actionUrl?: string
  undo?: { type: 'hibernate'; ids: string[] }
  createdAt: number
}

export interface ClosedTab {
  url: string
  title: string
  closedAt: number
}

export interface Stats {
  hibernated: number
  ramSavedMB: number
}

export interface BrowserState {
  tabs: Tab[]
  activeId: string
  closed: ClosedTab[]
  bookmarks: Bookmark[]
  history: HistoryEntry[]
  settings: Settings
  stats: Stats
  toasts: Toast[]
  zen: boolean
  hydrated: boolean
}
