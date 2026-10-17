import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Compass, Search, Sparkles, Star } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { searchQueryOf } from '../lib/sites'
import { searchConstellation } from '../lib/search'
import { ENGINE_URLS } from '../lib/sites'
import { externalPortalUrl, parseAddress } from '../lib/url'
import { isDesktop } from '../lib/desktop'

const EXAMPLES = ['notes', 'ambient radio', 'moon', 'comet game', 'shortcuts']

export function SearchPage() {
  const { activeTab, navigate, state } = useBrowser()
  const query = searchQueryOf(activeTab.url)
  const [draft, setDraft] = useState(query)

  useEffect(() => setDraft(query), [query])

  const results = useMemo(
    () => searchConstellation(query, state.bookmarks, state.history),
    [query, state.bookmarks, state.history],
  )

  const run = (q: string) => {
    const clean = q.trim()
    if (!clean) return
    const parsed = parseAddress(clean)
    if (parsed.mode !== 'search') {
      navigate(parsed.url)
      return
    }
    navigate(`star://search?q=${encodeURIComponent(clean)}`)
  }

  return (
    <div className="search-page">
      <div className="page__eyebrow">
        <Sparkles size={11} /> Star Search
      </div>

      <div className="search-page__bar">
        <Search size={16} color="var(--faint)" />
        <input
          className="search-page__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run(draft)}
          placeholder="Search the constellation…"
          autoFocus
          aria-label="Search the constellation"
        />
        <button className="btn btn--sm btn--primary" onClick={() => run(draft)}>
          <Search size={12} /> Search
        </button>
      </div>

      <div className="search-page__meta">
        <span>
          {results.length === 0
            ? `No local matches for “${query}”`
            : `${results.length} ${results.length === 1 ? 'match' : 'matches'} for “${query}”`}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Star size={10} color="var(--gold)" /> searched only on this device
        </span>
      </div>

      {results.length > 0 ? (
        <div className="search-results">
          {results.map((result) => {
            const Icon = result.icon ?? Compass
            return (
              <button key={result.id} className="result" onClick={() => navigate(result.url)}>
                <span className="result__top">
                  <span
                    className="result__fav"
                    style={{ '--fa': result.accent[0], '--fb': result.accent[1] } as React.CSSProperties}
                  >
                    <Icon size={12} strokeWidth={2.3} />
                  </span>
                  <span className="result__title">{result.title}</span>
                  <span className="suggest__type" style={{ marginLeft: 'auto' }}>
                    {result.label}
                  </span>
                  <ArrowUpRight size={13} color="var(--faint)" />
                </span>
                <span className="result__url">{result.url}</span>
                <span className="result__desc" style={{ display: 'block' }}>
                  {result.description}
                </span>
                {result.tags.length > 0 && (
                  <span className="result__tags">
                    {result.tags.slice(0, 4).map((tag) => (
                      <span className="mini-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="search-empty">
          <Search size={26} strokeWidth={1.5} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Nothing up there yet</div>
          <p style={{ fontSize: 12, maxWidth: 380 }}>
            Star Search looks through the built-in apps, your bookmarks and the pages you have visited.
            Try one of these instead:
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
            {EXAMPLES.map((example) => (
              <button key={example} className="chip" onClick={() => run(example)}>
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="search-web">
        <div className="search-web__text">
          <strong style={{ color: 'var(--text-2)' }}>Need the whole internet?</strong>
          <br />
          {isDesktop()
            ? 'Star opens it in a sandboxed Chromium tab — no tracking pixels in the shell.'
            : 'Star will open your search in the system browser — no tracking pixels in here.'}
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <button
            className="btn btn--sm"
            onClick={() =>
              navigate(
                isDesktop()
                  ? ENGINE_URLS.google(query || 'star browser')
                  : externalPortalUrl(ENGINE_URLS.google(query || 'star browser')),
              )
            }
          >
            <Compass size={12} /> Google it
          </button>
          <button
            className="btn btn--sm"
            onClick={() =>
              navigate(
                isDesktop()
                  ? ENGINE_URLS.duckduckgo(query || 'star browser')
                  : externalPortalUrl(ENGINE_URLS.duckduckgo(query || 'star browser')),
              )
            }
          >
            <Compass size={12} /> DuckDuckGo
          </button>
        </div>
      </div>
    </div>
  )
}
