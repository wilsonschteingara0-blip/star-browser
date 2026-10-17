import type { Bookmark, HistoryEntry } from './types'
import { INTERNAL_PAGES, SITES, siteByUrl, type SiteDef } from './sites'
import { hashAccent } from './sites'

export interface ConstellationResult {
  id: string
  url: string
  title: string
  description: string
  label: string
  tags: string[]
  icon?: SiteDef['icon']
  accent: [string, string]
  score: number
  kind: 'site' | 'page' | 'bookmark' | 'history'
}

function scoreMatch(query: string, haystacks: Array<[string, number]>): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0
  let best = 0
  for (const [text, weight] of haystacks) {
    const t = text.toLowerCase()
    if (t === q) best = Math.max(best, weight * 2.4)
    else if (t.startsWith(q)) best = Math.max(best, weight * 1.8)
    else if (t.split(/\s+/).some((w) => w.startsWith(q))) best = Math.max(best, weight * 1.5)
    else if (t.includes(q)) best = Math.max(best, weight)
  }
  return best
}

export function searchConstellation(
  query: string,
  bookmarks: Bookmark[] = [],
  history: HistoryEntry[] = [],
): ConstellationResult[] {
  const q = query.trim()
  if (!q) return []

  const results: ConstellationResult[] = []

  for (const site of SITES) {
    const score =
      scoreMatch(q, [
        [site.title, 100],
        [site.subtitle, 60],
        [site.description, 34],
      ]) + site.tags.reduce((acc, tag) => Math.max(acc, scoreMatch(q, [[tag, 52]])), 0)
    if (score > 0) {
      results.push({
        id: `site-${site.id}`,
        url: site.url,
        title: site.title,
        description: site.description,
        label: 'Constellation',
        tags: site.tags,
        icon: site.icon,
        accent: site.accent,
        score: score + 6,
        kind: 'site',
      })
    }
  }

  for (const page of INTERNAL_PAGES) {
    const score =
      scoreMatch(q, [
        [page.title, 88],
        [page.description, 30],
      ]) + page.tags.reduce((acc, tag) => Math.max(acc, scoreMatch(q, [[tag, 48]])), 0)
    if (score > 0) {
      results.push({
        id: `page-${page.url}`,
        url: page.url,
        title: page.title,
        description: page.description,
        label: 'Star Browser',
        tags: page.tags,
        icon: page.icon,
        accent: ['#9aa6ff', '#c8b6ff'],
        score: score + 3,
        kind: 'page',
      })
    }
  }

  for (const bookmark of bookmarks) {
    if (siteByUrl(bookmark.url) || bookmark.url.startsWith('star://')) continue
    const score = scoreMatch(q, [
      [bookmark.title, 76],
      [bookmark.url, 30],
    ])
    if (score > 0) {
      results.push({
        id: `bm-${bookmark.id}`,
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.url,
        label: 'Bookmark',
        tags: [],
        accent: hashAccent(bookmark.url),
        score,
        kind: 'bookmark',
      })
    }
  }

  const seen = new Set(results.map((r) => r.url))
  for (const entry of history) {
    if (seen.has(entry.url)) continue
    if (entry.url.startsWith('star://search') || entry.url.startsWith('star://newtab')) continue
    const score = scoreMatch(q, [
      [entry.title, 54],
      [entry.url, 22],
    ])
    if (score > 0) {
      seen.add(entry.url)
      results.push({
        id: `hist-${entry.id}`,
        url: entry.url,
        title: entry.title,
        description: entry.url,
        label: 'Visited',
        tags: [],
        accent: hashAccent(entry.url),
        score: score - 4,
        kind: 'history',
      })
    }
  }

  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 24)
}

export interface LocalSuggestion {
  id: string
  url: string
  title: string
  subtitle: string
  typeLabel: string
  icon?: SiteDef['icon']
  accent: [string, string]
}

export function quickSuggestions(
  query: string,
  bookmarks: Bookmark[],
  history: HistoryEntry[],
): LocalSuggestion[] {
  const results = searchConstellation(query, bookmarks, history)
  const seen = new Set<string>()
  const out: LocalSuggestion[] = []
  for (const r of results) {
    if (seen.has(r.url)) continue
    seen.add(r.url)
    out.push({
      id: r.id,
      url: r.url,
      title: r.title,
      subtitle: r.kind === 'site' || r.kind === 'page' ? r.url : r.description,
      typeLabel: r.kind === 'page' ? 'Built-in' : r.kind === 'site' ? 'App' : r.kind === 'bookmark' ? 'Bookmark' : 'History',
      icon: r.icon,
      accent: r.accent,
    })
    if (out.length >= 6) break
  }
  return out
}
