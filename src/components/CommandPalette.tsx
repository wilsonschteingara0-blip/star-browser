import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bookmark,
  History,
  Leaf,
  Moon,
  Palette,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  Laptop,
  Info,
  Keyboard,
  BookOpen,
  CornerDownLeft,
  RotateCcw,
} from 'lucide-react'
import { useBrowser } from '../store/browser'
import { INTERNAL_PAGES, SITES, SEARCH_ENGINES } from '../lib/sites'
import { pageTitle } from '../lib/sites'
import { searchConstellation } from '../lib/search'
import { memoryLabel } from '../lib/utils'
import type { ThemeId } from '../lib/types'

interface Command {
  id: string
  label: string
  hint?: string
  group: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  run: () => void
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const api = useBrowser()
  const {
    state,
    navigate,
    newTab,
    closeTab,
    hibernateWithUndo,
    toggleZen,
    setTheme,
    updateSettings,
    toggleBookmark,
    reopenLast,
    activeTab,
  } = api
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      window.setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [open])

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      {
        id: 'new-tab',
        label: 'New tab',
        hint: 't',
        group: 'Tabs & windows',
        icon: Plus,
        run: () => newTab(),
      },
      {
        id: 'hibernate',
        label: 'Hibernate idle tabs',
        hint: 'm',
        group: 'Memory',
        icon: Leaf,
        run: () => hibernateWithUndo(),
      },
      {
        id: 'memory-saver',
        label: state.settings.memorySaver ? 'Pause memory saver' : 'Turn on memory saver',
        group: 'Memory',
        icon: state.settings.memorySaver ? Laptop : Leaf,
        run: () => updateSettings({ memorySaver: !state.settings.memorySaver }),
      },
      {
        id: 'zen',
        label: 'Enter zen mode',
        hint: 'z',
        group: 'Focus',
        icon: Sparkles,
        run: () => toggleZen(),
      },
      {
        id: 'settings',
        label: 'Open settings',
        hint: ',',
        group: 'Star',
        icon: Settings,
        run: () => navigate('star://settings'),
      },
      {
        id: 'history',
        label: 'Open history',
        hint: 'h',
        group: 'Star',
        icon: History,
        run: () => navigate('star://history'),
      },
      {
        id: 'bookmarks',
        label: 'Open bookmarks',
        hint: 'b',
        group: 'Star',
        icon: Bookmark,
        run: () => navigate('star://bookmarks'),
      },
      {
        id: 'guide',
        label: 'Read the Star guide',
        group: 'Star',
        icon: BookOpen,
        run: () => navigate('docs.star'),
      },
      {
        id: 'shortcuts',
        label: 'Keyboard shortcuts',
        hint: '?',
        group: 'Star',
        icon: Keyboard,
        run: () => navigate('star://about#shortcuts'),
      },
      {
        id: 'about',
        label: 'About Star Browser',
        group: 'Star',
        icon: Info,
        run: () => navigate('star://about'),
      },
      {
        id: 'bookmark-page',
        label: `Bookmark “${activeTab.title}”`,
        group: 'This page',
        icon: Star,
        run: () => toggleBookmark(activeTab.url, activeTab.title),
      },
      {
        id: 'reload',
        label: 'Reload this page',
        group: 'This page',
        icon: RotateCcw,
        run: () => api.reload(),
      },
      {
        id: 'close',
        label: `Close “${activeTab.title}”`,
        group: 'This page',
        icon: Moon,
        run: () => closeTab(activeTab.id),
      },
      {
        id: 'reopen',
        label: 'Reopen last closed tab',
        group: 'Tabs & windows',
        icon: History,
        run: () => reopenLast(),
      },
      {
        id: 'theme-midnight',
        label: 'Theme: Midnight',
        group: 'Appearance',
        icon: Moon,
        run: () => setTheme('midnight'),
      },
      {
        id: 'theme-eclipse',
        label: 'Theme: Eclipse',
        group: 'Appearance',
        icon: Sparkles,
        run: () => setTheme('eclipse'),
      },
      {
        id: 'theme-daylight',
        label: 'Theme: Daylight',
        group: 'Appearance',
        icon: Sun,
        run: () => setTheme('daylight'),
      },
    ].map((c) => ({ ...c, run: () => {
      c.run()
      onClose()
    } })) as Command[]

    for (const site of SITES) {
      base.push({
        id: `site-${site.id}`,
        label: site.title,
        hint: site.url,
        group: 'Constellation',
        icon: site.icon,
        run: () => {
          navigate(site.url)
          onClose()
        },
      })
    }
    for (const page of INTERNAL_PAGES) {
      base.push({
        id: `page-${page.url}`,
        label: page.title,
        hint: page.url.replace('star://', ''),
        group: 'Star Browser',
        icon: page.icon,
        run: () => {
          navigate(page.url)
          onClose()
        },
      })
    }
    for (const bookmark of state.bookmarks) {
      base.push({
        id: `bm-${bookmark.id}`,
        label: bookmark.title,
        hint: bookmark.url,
        group: 'Bookmarks',
        icon: Bookmark,
        run: () => {
          navigate(bookmark.url)
          onClose()
        },
      })
    }
    const seen = new Set<string>()
    for (const entry of state.history.slice(0, 30)) {
      if (seen.has(entry.url) || !entry.title) continue
      seen.add(entry.url)
      base.push({
        id: `hist-${entry.id}`,
        label: entry.title,
        hint: entry.url,
        group: 'Recent',
        icon: History,
        run: () => {
          navigate(entry.url)
          onClose()
        },
      })
    }
    return base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings.memorySaver, state.bookmarks, state.history, activeTab.id, activeTab.url, activeTab.title])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      const order = ['Tabs & windows', 'Memory', 'Focus', 'Star', 'This page', 'Appearance', 'Constellation', 'Star Browser']
      return [...commands]
        .filter((c) => order.includes(c.group))
        .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
        .slice(0, 14)
    }
    return commands
      .map((c) => {
        const label = c.label.toLowerCase()
        let score = 0
        if (label === q) score = 100
        else if (label.startsWith(q)) score = 70
        else if (label.includes(q)) score = 40
        else if (c.hint?.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)) score = 20
        return { c, score }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 18)
      .map((x) => x.c)
  }, [commands, query])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const el = bodyRef.current?.querySelector<HTMLElement>('[data-selected="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected, open])

  if (!open) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selected]) {
        filtered[selected].run()
      } else if (query.trim()) {
        navigate(`star://search?q=${encodeURIComponent(query.trim())}`)
        onClose()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  const searchResults = query.trim().length > 1 && filtered.length < 3
    ? searchConstellation(query, state.bookmarks, state.history).slice(0, 4)
    : []

  let lastGroup = ''

  return (
    <div className="palette-scrim" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette__input-row">
          <Search size={18} color="var(--gold)" />
          <input
            ref={inputRef}
            className="palette__input"
            placeholder="Search Star, jump to a page, or run a command…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
          />
          <span className="palette__esc">esc to close</span>
        </div>
        <div className="palette__body" ref={bodyRef}>
          {filtered.length === 0 && (
            <div className="palette__empty">
              No command matches “{query}”. Press <kbd>↵</kbd> to search the constellation instead.
            </div>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon
            const showGroup = cmd.group !== lastGroup
            lastGroup = cmd.group
            return (
              <div key={cmd.id}>
                {showGroup && <div className="palette__group">{cmd.group}</div>}
                <button
                  className="palette__item"
                  data-selected={i === selected}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => cmd.run()}
                >
                  <span className="palette__icon">
                    <Icon size={14} />
                  </span>
                  <span className="palette__label">
                    {cmd.label}
                    {cmd.hint && !/^[a-z-]+\.[a-z]+$/.test(cmd.hint) && !cmd.hint.startsWith('star://') && (
                      <small>{cmd.hint}</small>
                    )}
                  </span>
                  {cmd.hint && (cmd.hint.startsWith('star://') || cmd.hint.includes('.')) && (
                    <span className="palette__hint">{cmd.hint}</span>
                  )}
                  {i === selected && (
                    <span className="palette__hint">
                      <CornerDownLeft size={11} />
                    </span>
                  )}
                </button>
              </div>
            )
          })}

          {searchResults.length > 0 && (
            <>
              <div className="palette__group">Constellation results</div>
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  className="palette__item"
                  onClick={() => {
                    navigate(`star://search?q=${encodeURIComponent(query)}`)
                    onClose()
                  }}
                >
                  <span className="palette__icon">
                    {r.icon ? <r.icon size={14} /> : <Search size={14} />}
                  </span>
                  <span className="palette__label">
                    {r.title}
                    <small>{r.description}</small>
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
        <div className="palette__footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> run
          </span>
          <span>
            <Star size={10} color="var(--gold)" /> {memoryLabel(state.stats.ramSavedMB)} memory saved
          </span>
        </div>
      </div>
    </div>
  )
}
