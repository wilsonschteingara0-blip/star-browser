import {
  BookOpen,
  Compass,
  Gamepad2,
  Home,
  Info,
  Mail,
  MoonStar,
  Radio,
  Settings,
  Feather,
  History,
  Bookmark,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { PageKind } from './types'

export interface SiteDef {
  id: string
  url: string
  title: string
  subtitle: string
  description: string
  tags: string[]
  icon: LucideIcon
  accent: [string, string]
  memoryBase: number
}

export const SITES: SiteDef[] = [
  {
    id: 'notes',
    url: 'nebula.star',
    title: 'Nebula Notes',
    subtitle: 'A quiet place for loud thoughts',
    description:
      'A small, local-first notes app. Jot a thought, close the tab, and it will still be here when you come back.',
    tags: ['notes', 'writing', 'journal', 'notes app', 'productivity'],
    icon: Feather,
    accent: ['#ff8a6b', '#f7c06d'],
    memoryBase: 62,
  },
  {
    id: 'mail',
    url: 'orbit.star',
    title: 'Orbit Mail',
    subtitle: 'Mail that stays in its lane',
    description:
      'A demo inbox in low orbit. Read, star and compose messages that never actually leave your machine.',
    tags: ['mail', 'email', 'inbox', 'compose', 'messages'],
    icon: Mail,
    accent: ['#6ea8ff', '#9b8bff'],
    memoryBase: 104,
  },
  {
    id: 'comet',
    url: 'comet.star',
    title: 'Comet Catcher',
    subtitle: 'Forty-five seconds of arcade joy',
    description:
      'Catch falling comets in a tiny canvas arcade game. Works with a mouse, touch, or the arrow keys.',
    tags: ['game', 'arcade', 'comet', 'play', 'fun'],
    icon: Gamepad2,
    accent: ['#ffcf6b', '#ff8a5c'],
    memoryBase: 86,
  },
  {
    id: 'docs',
    url: 'docs.star',
    title: 'Stellar Docs',
    subtitle: 'The manual for your new browser',
    description:
      'Guides for tab hibernation, keyboard shortcuts and privacy, plus the story behind Star Browser.',
    tags: ['docs', 'guide', 'help', 'readme', 'documentation', 'shortcuts'],
    icon: BookOpen,
    accent: ['#5ad6c2', '#6aa7ff'],
    memoryBase: 44,
  },
  {
    id: 'radio',
    url: 'radio.star',
    title: 'Focus Radio',
    subtitle: 'Generative ambient, tuned by you',
    description:
      'Three endless ambient stations generated live with the Web Audio API. No streams, no buffering, no data.',
    tags: ['music', 'radio', 'ambient', 'focus', 'sound'],
    icon: Radio,
    accent: ['#b590ff', '#f07bc0'],
    memoryBase: 72,
  },
  {
    id: 'sky',
    url: 'sky.star',
    title: 'Night Sky',
    subtitle: 'A pocket guide to looking up',
    description:
      "Tonight's moon, visible planets and a constellation worth finding — computed for wherever you are.",
    tags: ['sky', 'stars', 'moon', 'astronomy', 'night', 'planets'],
    icon: MoonStar,
    accent: ['#7dd3fc', '#a78bfa'],
    memoryBase: 38,
  },
]

export interface InternalPageDef {
  url: string
  title: string
  description: string
  icon: LucideIcon
  tags: string[]
}

export const INTERNAL_PAGES: InternalPageDef[] = [
  {
    url: 'star://newtab',
    title: 'New Tab',
    description: 'A calm place to start: the constellation, your recent pages, and the sky.',
    icon: Home,
    tags: ['home', 'start', 'new tab', 'begin'],
  },
  {
    url: 'star://history',
    title: 'History',
    description: 'Every page you have visited in Star Browser. Stored only on this device.',
    icon: History,
    tags: ['history', 'recent', 'visited'],
  },
  {
    url: 'star://bookmarks',
    title: 'Bookmarks',
    description: 'The pages you have decided to keep. Synced nowhere, owned by you.',
    icon: Bookmark,
    tags: ['bookmarks', 'saved', 'favorites'],
  },
  {
    url: 'star://settings',
    title: 'Settings',
    description: 'Appearance, memory saver, search engine, and the keys to your data.',
    icon: Settings,
    tags: ['settings', 'preferences', 'appearance', 'memory', 'privacy'],
  },
  {
    url: 'star://about',
    title: 'About Star Browser',
    description: 'Version, philosophy, shortcuts and the very short list of things we collect.',
    icon: Info,
    tags: ['about', 'version', 'shortcuts', 'help'],
  },
]

export const SEARCH_ENGINES = [
  { id: 'star' as const, label: 'Star Search', hint: 'Searches the built-in constellation', icon: Sparkles },
  { id: 'google' as const, label: 'Google', hint: 'Opens the open web', icon: Compass },
  { id: 'duckduckgo' as const, label: 'DuckDuckGo', hint: 'Opens the open web, privately', icon: Compass },
  { id: 'bing' as const, label: 'Bing', hint: 'Opens the open web', icon: Compass },
]

export const ENGINE_URLS: Record<'google' | 'duckduckgo' | 'bing', (q: string) => string> = {
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  duckduckgo: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  bing: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
}

export function siteByUrl(url: string): SiteDef | undefined {
  const clean = url.replace(/\/$/, '')
  return SITES.find((s) => s.url === clean || `https://${s.url}` === clean || `http://${s.url}` === clean)
}

export function siteById(id: string): SiteDef | undefined {
  return SITES.find((s) => s.id === id)
}

export function internalPageByUrl(url: string): InternalPageDef | undefined {
  return INTERNAL_PAGES.find((p) => p.url === url)
}

export function pageTitle(url: string): string {
  if (url.startsWith('star://search')) {
    const q = searchQueryOf(url)
    return q ? `${q} — Star Search` : 'Star Search'
  }
  if (url.startsWith('star://external')) {
    const u = externalTargetOf(url)
    try {
      return new URL(u).hostname
    } catch {
      return 'External page'
    }
  }
  const site = siteByUrl(url)
  if (site) return site.title
  const internal = internalPageByUrl(url)
  if (internal) return internal.title
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'New Tab'
  }
}

export function pageKind(url: string): PageKind {
  if (url.startsWith('star://search')) return 'search'
  if (url.startsWith('star://external')) return 'external'
  if (url.startsWith('star://')) return 'internal'
  if (siteByUrl(url)) return 'site'
  return 'external'
}

export function searchQueryOf(url: string): string {
  try {
    const u = new URL(url)
    return u.searchParams.get('q') ?? ''
  } catch {
    return ''
  }
}

export function externalTargetOf(url: string): string {
  try {
    const u = new URL(url)
    return u.searchParams.get('url') ?? ''
  } catch {
    return ''
  }
}

export function faviconInfo(url: string): { icon: LucideIcon; accent: [string, string]; label: string } {
  const site = siteByUrl(url)
  if (site) return { icon: site.icon, accent: site.accent, label: site.title }
  if (url.startsWith('star://search')) {
    return { icon: Compass, accent: ['#8b9bff', '#c4b5fd'], label: 'Star Search' }
  }
  if (url.startsWith('star://external')) {
    return { icon: Compass, accent: ['#7c879e', '#aab4c8'], label: 'Open web' }
  }
  const internal = internalPageByUrl(url)
  if (internal) return { icon: internal.icon, accent: ['#8b9bff', '#c4b5fd'], label: internal.title }
  const host = (() => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  })()
  return {
    icon: Compass,
    accent: hashAccent(host),
    label: host || 'Page',
  }
}

export function memoryBaseline(url: string): number {
  const site = siteByUrl(url)
  if (site) return site.memoryBase
  if (url.startsWith('star://external')) return 118
  if (url.startsWith('star://search')) return 24
  if (url.startsWith('star://settings')) return 19
  if (url.startsWith('star://history')) return 17
  if (url.startsWith('star://bookmarks')) return 16
  if (url.startsWith('star://about')) return 14
  if (url.startsWith('star://newtab')) return 26
  return 90
}

export const ACCENTS: Array<[string, string]> = [
  ['#ff8a6b', '#f7c06d'],
  ['#6ea8ff', '#9b8bff'],
  ['#5ad6c2', '#6aa7ff'],
  ['#b590ff', '#f07bc0'],
  ['#ffcf6b', '#ff8a5c'],
  ['#7dd3fc', '#a78bfa'],
]

export function hashAccent(input: string): [string, string] {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return ACCENTS[h % ACCENTS.length]
}

export function siteInitials(title: string): string {
  const words = title.replace(/[^\w\s]/g, '').split(/\s+/)
  return (words[0]?.[0] ?? 'S').toUpperCase() + (words[1]?.[0] ?? '').toUpperCase()
}

export const STAR_QUOTES = [
  'We are all made of star-stuff. — Carl Sagan',
  'The cosmos is within us. — Carl Sagan',
  'Somewhere, something incredible is waiting to be known. — Carl Sagan',
  'Look up at the stars and not down at your feet. — Stephen Hawking',
  'The stars are the land-marks of the universe. — Sir John Herschel',
  'We have calcium in our bones, iron in our veins. — Hafiz',
]

export const STAR_SEED_HISTORY: Array<{ url: string; title: string; minutesAgo: number }> = [
  { url: 'docs.star', title: 'Stellar Docs', minutesAgo: 42 },
  { url: 'nebula.star', title: 'Nebula Notes', minutesAgo: 96 },
  { url: 'sky.star', title: 'Night Sky', minutesAgo: 190 },
  { url: 'star://about', title: 'About Star Browser', minutesAgo: 1450 },
]

export const STAR_SEED_BOOKMARKS: string[] = ['nebula.star', 'comet.star', 'docs.star', 'sky.star']
