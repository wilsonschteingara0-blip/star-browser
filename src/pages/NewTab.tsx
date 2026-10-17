import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Leaf,
  Moon,
  Search,
  Sparkles,
} from 'lucide-react'
import { useBrowser } from '../store/browser'
import { ENGINE_URLS, SEARCH_ENGINES, SITES, STAR_QUOTES } from '../lib/sites'
import { externalPortalUrl, parseAddress } from '../lib/url'
import { formatClock, formatDateLine, greeting, memoryLabel, timeAgo } from '../lib/utils'
import { moonInfo } from '../lib/sky'
import { faviconInfo } from '../lib/sites'
import { StarMark } from '../components/StarMark'
import { engineLabel, isDesktop } from '../lib/desktop'
import { useMemoryStats } from '../components/MemoryPanel'
import type { SearchEngineId } from '../lib/types'

export function NewTab() {
  const { state, navigate, updateSettings, hibernateWithUndo } = useBrowser()
  const [now, setNow] = useState(() => new Date())
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const engine = state.settings.searchEngine
  const mem = useMemoryStats()

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const moon = moonInfo(now)
  const quote = STAR_QUOTES[Math.floor(Date.now() / 86_400_000) % STAR_QUOTES.length]

  const recent = useMemo(() => {
    const seen = new Set<string>()
    return state.history
      .filter((h) => {
        if (seen.has(h.url)) return false
        seen.add(h.url)
        return h.url !== 'star://newtab'
      })
      .slice(0, 3)
  }, [state.history])

  const submit = () => {
    const q = query.trim()
    if (!q) return
    // Like a real address bar: an address opens, a question searches.
    const parsed = parseAddress(q)
    if (parsed.mode !== 'search') {
      navigate(parsed.url)
    } else if (engine === 'star') {
      navigate(`star://search?q=${encodeURIComponent(q)}`)
    } else {
      const target = ENGINE_URLS[engine](q)
      navigate(isDesktop() ? target : externalPortalUrl(target))
    }
    setQuery('')
  }

  const engineMeta = SEARCH_ENGINES.find((e) => e.id === engine)
  const sleepingCount = state.tabs.filter((t) => t.sleeping).length
  const activeTabs = state.tabs.length - sleepingCount

  return (
    <div className="newtab">
      <div className="newtab__top">
        <span className="newtab__top-left">
          <StarMark size={12} gradient />
          Star Browser · {isDesktop() ? engineLabel() : 'a calmer constellation'}
        </span>
        <span className="newtab__clock">
          {formatDateLine(now)}
          <strong>{formatClock(now)}</strong>
        </span>
      </div>

      <div className="newtab__hero">
        <div className="newtab__eyebrow">The sky is quiet today</div>
        <h1 className="newtab__greeting">
          {greeting(now)}, <span>star-gazer</span>
        </h1>
        <p className="newtab__sub">
          Pick a star from the constellation, or search across everything you have saved. No queues,
          no trackers — just a lighter place to browse.
        </p>

        <div className="starsearch">
          <div className="starsearch__field">
            <span className="starsearch__star">
              <StarMark size={20} gradient />
            </span>
            <input
              ref={searchRef}
              className="starsearch__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') setQuery('')
              }}
              placeholder={
                engine === 'star'
                  ? 'Search the constellation, notes, history…'
                  : `Search with ${engineMeta?.label ?? 'the web'}…`
              }
              aria-label="Search Star Browser"
            />
            <span className="starsearch__hint">
              <kbd>↵</kbd>
            </span>
            <button className="starsearch__go" onClick={submit} aria-label="Search">
              <Search size={17} />
            </button>
          </div>

          <div className="engine-row">
            <span style={{ fontSize: 10, color: 'var(--faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 2 }}>
              Search with
            </span>
            {SEARCH_ENGINES.map((e) => (
              <button
                key={e.id}
                className="engine-chip"
                data-active={engine === e.id}
                onClick={() => updateSettings({ searchEngine: e.id as SearchEngineId })}
                title={e.hint}
              >
                <span className="engine-chip__dot" />
                {e.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="constellation">
        <div className="constellation__head">
          <div>
            <div className="constellation__head-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="constellation__title">The constellation</h2>
              <span className="constellation__sub" style={{ marginTop: 0 }}>
                six little places, all built in
              </span>
            </div>
            <p className="constellation__sub">
              Every one of these runs inside Star. Open them all; they barely sip memory.
            </p>
          </div>
          <button className="constellation__all" onClick={() => navigate('star://about#apps')}>
            What is this? <ArrowUpRight size={12} />
          </button>
        </div>

        <div className="site-grid">
          {SITES.map((site) => {
            const Icon = site.icon
            return (
              <button
                key={site.id}
                className="site-card"
                style={{ '--ca': site.accent[0], '--cb': site.accent[1] } as React.CSSProperties}
                onClick={() => navigate(site.url)}
              >
                <div className="site-card__top">
                  <span className="site-card__icon">
                    <Icon size={17} strokeWidth={2} />
                  </span>
                  <ArrowUpRight className="site-card__arrow" size={15} />
                </div>
                <div className="site-card__body">
                  <span className="site-card__title">{site.title}</span>
                  <span className="site-card__sub">{site.subtitle}</span>
                </div>
                <div className="site-card__foot">
                  <span className="site-card__url">{site.url}</span>
                  <span className="site-card__mem">
                    <Leaf size={8} /> ~{site.memoryBase} MB
                  </span>
                </div>
                <span className="site-card__accent" />
              </button>
            )
          })}
        </div>
      </section>

      <div className="newtab__widgets">
        <div className="widget">
          <div className="widget__head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Clock3 size={11} /> Pick up where you left off
            </span>
            <button className="bookmarksbar__more" style={{ padding: 0, height: 'auto' }} onClick={() => navigate('star://history')}>
              all history
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="recent-empty">
              <span>Nothing visited yet — your trail starts here.</span>
            </div>
          ) : (
            <div className="recent-list">
              {recent.map((entry) => {
                const info = faviconInfo(entry.url)
                const Icon = info.icon
                return (
                  <button key={entry.id} className="recent-item" onClick={() => navigate(entry.url)}>
                    <span
                      className="recent-item__fav"
                      style={{ '--fa': info.accent[0], '--fb': info.accent[1] } as React.CSSProperties}
                    >
                      <Icon size={10} strokeWidth={2.4} />
                    </span>
                    <span className="recent-item__text">
                      <span className="recent-item__title">{entry.title || entry.url}</span>
                      <span className="recent-item__meta">{entry.url.replace('star://', '')}</span>
                    </span>
                    <span className="recent-item__time">{timeAgo(entry.visitedAt)}</span>
                  </button>
                )
              })}
            </div>
          )}
          <button className="widget__link" onClick={() => navigate('star://history')}>
            Open history <ArrowRight size={11} />
          </button>
        </div>

        <div className="widget">
          <div className="widget__head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Moon size={11} /> Tonight's sky
            </span>
            <span style={{ letterSpacing: 0, textTransform: 'none', fontWeight: 500 }}>
              {moon.emoji} {Math.round(moon.illumination * 100)}%
            </span>
          </div>
          <div className="sky-mini">
            <span
              className="moon-glyph"
              style={{ '--shadow-offset': `${moon.shiftPercent}%` } as React.CSSProperties}
            />
            <span className="sky-mini__text">
              <span className="sky-mini__phase">{moon.name}</span>
              <span className="sky-mini__detail">
                {Math.round(moon.illumination * 100)}% illuminated · {Math.round(moon.ageDays)} days into
                the cycle
              </span>
            </span>
          </div>
          <button className="widget__link" onClick={() => navigate('sky.star')}>
            Open the Night Sky guide <ArrowRight size={11} />
          </button>
        </div>

        <div className="widget">
          <div className="widget__head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Leaf size={11} /> Memory tonight
            </span>
            <span style={{ letterSpacing: 0, textTransform: 'none', fontWeight: 500, color: 'var(--good)' }}>
              {memoryLabel(state.stats.ramSavedMB)} saved
            </span>
          </div>
          <div className="mem-mini">
            <div className="mem-mini__total">
              <strong>{Math.round(mem.total)}</strong>
              <span>
                MB across {state.tabs.length} {state.tabs.length === 1 ? 'tab' : 'tabs'}
              </span>
            </div>
            <div className="mem-mini__bar">
              <span
                className="mem-mini__seg"
                data-kind="active"
                style={{ width: `${Math.max(8, (mem.activeMB / mem.total) * 100)}%` }}
              />
              <span
                className="mem-mini__seg"
                data-kind="sleep"
                style={{ width: `${(mem.sleepingMB / mem.total) * 100}%` }}
              />
              <span
                className="mem-mini__seg"
                data-kind="chrome"
                style={{ width: `${(128 / mem.total) * 100}%` }}
              />
            </div>
            <div className="mem-mini__legend">
              <span>
                <i style={{ background: 'var(--gold)' }} /> {activeTabs} awake
              </span>
              <span>
                <i style={{ background: 'var(--accent)' }} /> {sleepingCount} hibernating
              </span>
              <span>
                <i style={{ background: 'var(--line-strong)' }} /> star itself
              </span>
            </div>
            <button className="mem-mini__btn" onClick={() => hibernateWithUndo()}>
              <Moon size={12} /> Let idle tabs drift off
            </button>
          </div>
        </div>
      </div>

      <p className="newtab__quote">
        {quote}
        <span>✦</span>
      </p>
    </div>
  )
}
