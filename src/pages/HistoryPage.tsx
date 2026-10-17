import { useMemo, useState } from 'react'
import { ArrowUpRight, Clock3, Search, Trash2, X } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { faviconInfo } from '../lib/sites'
import { dayLabel, localTimeOf, plural } from '../lib/utils'

export function HistoryPage() {
  const { state, navigate, removeHistory, clearHistory, toast } = useBrowser()
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    if (!filter.trim()) return state.history
    const q = filter.toLowerCase()
    return state.history.filter(
      (h) => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q),
    )
  }, [state.history, filter])

  const groups = useMemo(() => {
    const map = new Map<string, typeof state.history>()
    for (const entry of filtered) {
      const key = dayLabel(entry.visitedAt)
      const list = map.get(key) ?? []
      list.push(entry)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [filtered, state.history])

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__eyebrow">
            <Clock3 size={11} /> Your trail
          </div>
          <h1 className="page__title">History</h1>
          <p className="page__sub">
            Every page Star has opened, kept only on this device. Hibernate tabs and your trail stays
            intact.
          </p>
        </div>
        <div className="page__actions">
          <button
            className="btn btn--danger btn--sm"
            onClick={() => {
              if (state.history.length === 0) return
              clearHistory()
              toast('History cleared — a clean sky', { icon: 'check' })
            }}
          >
            <Trash2 size={13} /> Clear history
          </button>
        </div>
      </div>

      <div className="history-tools">
        <div className="history-search">
          <Search size={13} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search your history…"
            aria-label="Search history"
          />
          {filter && (
            <button className="icon-btn" style={{ width: 20, height: 20 }} onClick={() => setFilter('')}>
              <X size={11} />
            </button>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--faint)' }}>
          {plural(filtered.length, 'page')} {filtered.length !== state.history.length && `of ${state.history.length}`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">
            <Clock3 size={20} />
          </span>
          <h3>{state.history.length === 0 ? 'A clean sky' : 'Nothing found'}</h3>
          <p>
            {state.history.length === 0
              ? 'Pages you visit will appear here. Star keeps this list on this device only.'
              : 'No pages match that search. Try a different word, or clear the filter.'}
          </p>
        </div>
      ) : (
        <div className="history-groups">
          {groups.map(([label, entries]) => (
            <section key={label}>
              <div className="history-day__label">
                {label} <span>· {plural(entries.length, 'page')}</span>
              </div>
              <div className="history-day__list">
                {entries.map((entry) => {
                  const info = faviconInfo(entry.url)
                  const Icon = info.icon
                  return (
                    <div key={entry.id} className="history-row">
                      <span
                        className="history-row__fav"
                        style={{ '--fa': info.accent[0], '--fb': info.accent[1] } as React.CSSProperties}
                      >
                        <Icon size={11} strokeWidth={2.4} />
                      </span>
                      <button className="history-row__main" onClick={() => navigate(entry.url)}>
                        <div className="history-row__title">{entry.title || entry.url}</div>
                        <div className="history-row__url">{entry.url}</div>
                      </button>
                      <span className="history-row__time">{localTimeOf(entry.visitedAt)}</span>
                      <span className="history-row__time" style={{ color: 'var(--faint)' }}>
                        {entry.url.startsWith('star://') ? 'built-in' : ''}
                      </span>
                      <button
                        className="history-row__remove"
                        title="Remove from history"
                        onClick={() => removeHistory(entry.id)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--faint)' }}>
        <ArrowUpRight size={12} />
        Star never syncs this list. Export a copy in{' '}
        <button
          style={{ color: 'var(--gold)', fontSize: 11 }}
          onClick={() => navigate('star://settings#privacy')}
        >
          Settings → Privacy
        </button>
        .
      </div>
    </div>
  )
}
