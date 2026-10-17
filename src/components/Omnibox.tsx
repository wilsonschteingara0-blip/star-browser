import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, CornerDownLeft, Compass, Globe, Search, Sparkles } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { ENGINE_URLS, SEARCH_ENGINES, pageTitle as pageTitleOf } from '../lib/sites'
import { quickSuggestions } from '../lib/search'
import { fetchWebSuggestions } from '../lib/webSuggestions'
import { displayAddress, externalPortalUrl, parseAddress } from '../lib/url'
import { faviconInfo } from '../lib/sites'
import { StarMark } from './StarMark'
import { isDesktop } from '../lib/desktop'

type RowKind = 'open' | 'search' | 'local' | 'web'

interface Row {
  id: string
  kind: RowKind
  title: string
  subtitle: string
  badge?: string
  url?: string
  query?: string
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>
  accent?: [string, string]
}

const ENGINE_HINT: Record<string, string> = {
  star: 'Star',
  google: 'Google',
  duckduckgo: 'DDG',
  bing: 'Bing',
}

export function Omnibox() {
  const { state, activeTab, navigate } = useBrowser()
  const [draft, setDraft] = useState(() => displayAddress(activeTab.url))
  const [focused, setFocused] = useState(false)
  const [typing, setTyping] = useState(false)
  const [selected, setSelected] = useState(0)
  const [web, setWeb] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const native = isDesktop()
  const engine = state.settings.searchEngine
  const engineMeta = SEARCH_ENGINES.find((e) => e.id === engine) ?? SEARCH_ENGINES[0]

  useEffect(() => {
    if (!focused) setDraft(displayAddress(activeTab.url))
  }, [activeTab.url, activeTab.id, focused])

  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    const blur = () => inputRef.current?.blur()
    window.addEventListener('star:focus-omnibox', focus)
    window.addEventListener('star:blur-omnibox', blur)
    return () => {
      window.removeEventListener('star:focus-omnibox', focus)
      window.removeEventListener('star:blur-omnibox', blur)
    }
  }, [])

  const q = draft.trim()
  const queryActive = focused && q.length > 0
  // Suggestions appear once you actually type — a freshly focused address bar
  // stays quiet, like Chrome's.
  const showSuggestions = focused && typing
  const looksLikeUrl = useMemo(() => {
    if (!q || /\s/.test(q)) return false
    return /^([a-z]+:\/\/|localhost|([a-z0-9-]+\.)+[a-z]{2,})(:\d+)?([/?#].*)?$/i.test(q)
  }, [q])

  const direct = useMemo(() => {
    if (!q || /\s/.test(q)) return null
    const parsed = parseAddress(q)
    return parsed.mode === 'search' ? null : parsed.url
  }, [q])

  const local = useMemo(
    () => (queryActive ? quickSuggestions(q, state.bookmarks, state.history) : []),
    [queryActive, q, state.bookmarks, state.history],
  )

  const idleSuggestions = useMemo(
    () =>
      [
        { url: 'nebula.star', label: 'Continue in Nebula Notes' },
        { url: 'radio.star', label: 'Open Focus Radio' },
        { url: 'star://settings', label: 'Tune memory saver' },
        { url: 'docs.star', label: 'Read the manual' },
      ].map((s) => {
        const info = faviconInfo(s.url)
        return {
          id: `idle-${s.url}`,
          kind: 'local' as const,
          title: info.label,
          subtitle: s.label,
          badge: 'Jump to',
          url: s.url,
          icon: info.icon,
          accent: info.accent,
        }
      }),
    [],
  )

  useEffect(() => {
    if (!queryActive || direct) {
      setWeb([])
      return
    }
    let alive = true
    const timer = window.setTimeout(async () => {
      const results = await fetchWebSuggestions(q)
      if (!alive) return
      setWeb(results.filter((r) => r.toLowerCase() !== q.toLowerCase()).slice(0, 4))
    }, 260)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, queryActive, direct])

  const rows = useMemo<Row[]>(() => {
    if (!showSuggestions) return []
    if (!queryActive) return idleSuggestions

    const list: Row[] = []
    if (direct) {
      const info = faviconInfo(direct)
      const isExternal = direct.startsWith('http')
      list.push({
        id: 'open',
        kind: 'open',
        title: isExternal ? direct.replace(/^https?:\/\//, '') : pageTitleOf(direct),
        subtitle: isExternal ? (native ? 'Open in a Chromium tab' : 'Open through the portal') : direct,
        badge: isExternal ? (native ? 'Chromium' : 'Portal') : 'Built-in',
        url: direct,
        icon: isExternal ? Globe : info.icon,
        accent: isExternal ? undefined : info.accent,
      })
    }
    list.push({
      id: 'search',
      kind: 'search',
      title: q,
      subtitle:
        engine === 'star'
          ? direct
            ? 'Search the constellation instead'
            : 'Search the constellation'
          : native
            ? `Search with ${engineMeta.label} in a Chromium tab`
            : `Search with ${engineMeta.label} in your system browser`,
      badge: engine === 'star' ? 'Star Search' : engineMeta.label,
      query: q,
      icon: engine === 'star' ? Sparkles : Search,
    })

    for (const item of local) {
      if (direct && item.url === direct) continue
      list.push({
        id: item.id,
        kind: 'local',
        title: item.title,
        subtitle: item.subtitle,
        badge: item.typeLabel,
        url: item.url,
        icon: item.icon,
        accent: item.accent,
      })
    }

    for (const phrase of web) {
      list.push({
        id: `web-${phrase}`,
        kind: 'web',
        title: phrase,
        subtitle:
          engine === 'star'
            ? 'Search the constellation'
            : `Search ${engineMeta.label}`,
        badge: engineMeta.label,
        query: phrase,
        icon: Search,
      })
    }
    return list
  }, [showSuggestions, queryActive, idleSuggestions, direct, looksLikeUrl, q, local, web, engine, engineMeta.label])

  useEffect(() => {
    setSelected(0)
  }, [draft, focused, typing])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-selected="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const commit = (row?: Row) => {
    const chosen = row ?? rows[selected]
    if (!chosen) {
      navigate(draft)
      setFocused(false)
      inputRef.current?.blur()
      return
    }
    if (chosen.kind === 'open' && chosen.url) {
      navigate(chosen.url)
    } else if (chosen.kind === 'search' && chosen.query) {
      search(chosen.query)
    } else if (chosen.kind === 'web' && chosen.query) {
      search(chosen.query)
    } else if (chosen.url) {
      navigate(chosen.url)
    }
    setFocused(false)
    setTyping(false)
    inputRef.current?.blur()
  }

  const search = (query: string) => {
    if (engine === 'star') {
      navigate(`star://search?q=${encodeURIComponent(query)}`)
    } else {
      const target = ENGINE_URLS[engine](query)
      navigate(native ? target : externalPortalUrl(target))
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setDraft(displayAddress(activeTab.url))
      setTyping(false)
      setFocused(false)
      inputRef.current?.blur()
    }
  }

  const secure = activeTab.kind === 'internal' || activeTab.kind === 'site' || activeTab.kind === 'search'

  return (
    <div className={`omnibox ${focused ? 'omnibox--focused' : ''}`}>
      <div className="omnibox__field">
        <span
          className="omnibox__secure"
          title={secure ? 'Star keeps this page local' : native ? 'Opens in a Chromium tab' : 'Opens outside Star'}
        >
          {secure ? <StarMark size={15} gradient /> : <Globe size={15} />}
        </span>
        <input
          ref={inputRef}
          data-omnibox-input
          className="omnibox__input"
          value={draft}
          spellCheck={false}
          autoComplete="off"
          aria-label="Address and search bar"
          placeholder={
            engine === 'star'
              ? 'Search the constellation, or enter an address'
              : `Search with ${engineMeta.label}, or enter an address`
          }
          onChange={(e) => {
            setTyping(true)
            setDraft(e.target.value)
          }}
          onFocus={(e) => {
            setFocused(true)
            setTyping(false)
            setDraft(activeTab.url)
            e.currentTarget.select()
          }}
          onBlur={() => {
            setFocused(false)
            setTyping(false)
            setDraft(displayAddress(activeTab.url))
          }}
          onKeyDown={onKeyDown}
        />
        {!focused && (
          <span className="omnibox__hint">
            <kbd>/</kbd> to search
          </span>
        )}
        {focused && (
          <span className="suggest__footer-group">
            <span className="omnibox__engine">
              <engineMeta.icon size={11} />
              {ENGINE_HINT[engine]}
            </span>
          </span>
        )}
      </div>

      {showSuggestions && (
        <div className="suggest" ref={listRef} onMouseDown={(e) => e.preventDefault()}>
          {!queryActive && <div className="suggest__group-label">Jump back in</div>}
          {rows.map((row, i) => {
            const Icon = row.icon
            return (
              <button
                key={row.id}
                className="suggest__item"
                data-selected={i === selected}
                onMouseEnter={() => setSelected(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  commit(row)
                }}
              >
                <span
                  className={`suggest__fav ${row.kind === 'open' || row.kind === 'search' || row.kind === 'web' ? 'suggest__fav--ghost' : ''}`}
                  style={
                    row.accent
                      ? ({ '--fa': row.accent[0], '--fb': row.accent[1] } as React.CSSProperties)
                      : undefined
                  }
                >
                  {Icon ? <Icon size={12} strokeWidth={2.2} /> : <Compass size={12} />}
                </span>
                <span className="suggest__text">
                  <span className="suggest__title">
                    {row.kind === 'search' ? (
                      <>
                        Search <span className="suggest__highlight">“{row.title}”</span>
                      </>
                    ) : row.kind === 'open' ? (
                      <>
                        Open <span className="suggest__highlight">{row.title}</span>
                      </>
                    ) : (
                      row.title
                    )}
                  </span>
                  <span className="suggest__url">{row.subtitle}</span>
                </span>
                {row.badge && <span className="suggest__type">{row.badge}</span>}
                <span className="suggest__action">
                  {row.kind === 'local' ? <CornerDownLeft size={11} /> : <ArrowUpRight size={12} />}
                </span>
              </button>
            )
          })}

          {queryActive && (
            <div className="suggest__footer">
              <span className="suggest__footer-group">
                <span>
                  <kbd>↑</kbd> <kbd>↓</kbd> browse
                </span>
                <span>
                  <kbd>↵</kbd> select
                </span>
              </span>
              <span className="suggest__footer-group">
                {looksLikeUrl ? <Globe size={10} /> : <Search size={10} />}
                {looksLikeUrl
                  ? native
                    ? 'Opens in a Chromium tab'
                    : 'Opens through the portal'
                  : engine === 'star'
                    ? 'Star answers locally'
                    : native
                      ? `Searches ${engineMeta.label} in Chromium`
                      : `Hands off to ${engineMeta.label}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
