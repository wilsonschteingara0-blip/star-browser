import { SITES, siteByUrl } from './sites'

export interface ParsedAddress {
  url: string
  mode: 'internal' | 'site' | 'external' | 'search'
}

const INTERNAL_ALIASES: Record<string, string> = {
  newtab: 'star://newtab',
  'new-tab': 'star://newtab',
  start: 'star://newtab',
  home: 'star://newtab',
  history: 'star://history',
  bookmarks: 'star://bookmarks',
  'bookmarks-bar': 'star://bookmarks',
  settings: 'star://settings',
  preferences: 'star://settings',
  about: 'star://about',
  help: 'star://about',
  chromium: 'star://chromium',
  engine: 'star://chromium',
  chromium_engine: 'star://chromium',
}

export function parseAddress(raw: string): ParsedAddress {
  const input = raw.trim()
  if (!input) return { url: 'star://newtab', mode: 'internal' }

  if (input.startsWith('star://')) {
    if (input.startsWith('star://search')) return { url: input, mode: 'search' }
    const key = input.slice('star://'.length).replace(/\/$/, '').toLowerCase()
    return { url: INTERNAL_ALIASES[key] ?? 'star://newtab', mode: 'internal' }
  }

  // A bare word like "chromium" or "history" is a Star page, like a real
  // browser's internal URLs.
  const alias = INTERNAL_ALIASES[input.toLowerCase()]
  if (alias) return { url: alias, mode: 'internal' }

  const site = siteByUrl(input) ?? SITES.find((s) => s.id === input.toLowerCase())
  if (site) return { url: site.url, mode: 'site' }

  if (/^(https?:\/\/|about:|file:)/i.test(input)) {
    return { url: input, mode: 'external' }
  }

  // Looks like a hostname or IP: open it through the portal.
  const hostLike = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.?(:[0-9]+)?(\/\S*)?$/i
  if (hostLike.test(input) && (/\./.test(input) || /^localhost(:|\/|$)/i.test(input)) && !/\s/.test(input)) {
    return { url: `https://${input}`, mode: 'external' }
  }

  return { url: `star://search?q=${encodeURIComponent(input)}`, mode: 'search' }
}

export function prettyUrl(url: string): string {
  if (url.startsWith('star://search')) {
    const query = new URL(url).searchParams.get('q') ?? ''
    return `star search — ${query}`
  }
  if (url.startsWith('star://external')) {
    try {
      return new URL(url).searchParams.get('url') ?? url
    } catch {
      return url
    }
  }
  if (url.startsWith('https://')) return url.slice('https://'.length).replace(/\/$/, '')
  if (url.startsWith('http://')) return url.slice('http://'.length).replace(/\/$/, '')
  return url
}

export function displayAddress(url: string): string {
  if (url.startsWith('star://search')) {
    const query = new URL(url).searchParams.get('q') ?? ''
    return `star search: ${query}`
  }
  return prettyUrl(url)
}

export function externalUrlOf(url: string): string {
  if (url.startsWith('star://external')) {
    try {
      return new URL(url).searchParams.get('url') ?? ''
    } catch {
      return ''
    }
  }
  return url
}

export function externalPortalUrl(target: string): string {
  return `star://external?url=${encodeURIComponent(target)}`
}

export function isNewTab(url: string): boolean {
  return url === 'star://newtab' || url === 'star://newtab/'
}

export function hostnameOf(url: string): string {
  if (url.startsWith('star://external')) {
    try {
      return new URL(new URL(url).searchParams.get('url') ?? '').hostname
    } catch {
      return 'open web'
    }
  }
  if (url.startsWith('star://')) return 'Star Browser'
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
