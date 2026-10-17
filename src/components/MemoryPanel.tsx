import { useMemo, useState } from 'react'
import { ArrowUpRight, Leaf, Moon, Settings2, Snowflake } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { useClickOutside } from '../lib/hooks'
import { faviconInfo } from '../lib/sites'
import { memoryLabel } from '../lib/utils'

export const CHROME_MEMORY_MB = 128
const SLEEPING_MEMORY_MB = 9

export function useMemoryStats() {
  const { state, activeTab } = useBrowser()
  return useMemo(() => {
    const activeMB = activeTab.sleeping ? SLEEPING_MEMORY_MB : activeTab.memoryMB
    const others = state.tabs.filter((t) => t.id !== activeTab.id)
    const awakeMB = others.filter((t) => !t.sleeping).reduce((acc, t) => acc + t.memoryMB, 0)
    const sleepingMB = state.tabs.filter((t) => t.sleeping).length * SLEEPING_MEMORY_MB
    const sleepers = state.tabs.filter((t) => t.sleeping).length
    const total = CHROME_MEMORY_MB + activeMB + awakeMB + (sleepingMB - (activeTab.sleeping ? SLEEPING_MEMORY_MB : 0))
    const level = total > 1400 ? 'high' : total > 700 ? 'mid' : 'low'
    const potential = others
      .filter((t) => !t.sleeping)
      .reduce((acc, t) => acc + Math.max(t.memoryMB - SLEEPING_MEMORY_MB, 0), 0)
    return { total, activeMB, awakeMB, sleepingMB, sleepers, level, potential }
  }, [state.tabs, activeTab])
}

export function MemoryPill() {
  const { state, hibernateWithUndo, navigate, sleepTab } = useBrowser()
  const stats = useMemoryStats()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open)

  return (
    <div className="popover-anchor" ref={ref}>
      <button
        className="memory-pill"
        onClick={() => setOpen((v) => !v)}
        title="Memory used by Star Browser"
        aria-expanded={open}
      >
        <span className="memory-pill__dot" data-level={stats.level} />
        <span className="memory-pill__label">{memoryLabel(stats.total)}</span>
        {stats.sleepers > 0 && (
          <span className="memory-pill__sleepers">
            <Moon size={10} />
            {stats.sleepers}
          </span>
        )}
      </button>

      {open && (
        <div className="popover memory-panel">
          <div className="memory-panel__head">
            <div>
              <div className="memory-panel__title">Memory</div>
              <div className="memory-panel__sub">
                {state.tabs.length} tabs · {state.settings.memorySaver ? 'Memory saver on' : 'Memory saver off'}
              </div>
            </div>
            <div className="memory-total">
              <strong>{Math.round(stats.total)}</strong>
              <span>MB total</span>
            </div>
          </div>

          <div className="memory-bar">
            <span
              className="memory-bar__seg"
              style={{
                width: `${(CHROME_MEMORY_MB / stats.total) * 100}%`,
                background: 'var(--line-strong)',
              }}
              title="Browser chrome"
            />
            <span
              className="memory-bar__seg"
              style={{
                width: `${(stats.activeMB / stats.total) * 100}%`,
                background: 'linear-gradient(90deg, var(--gold-2), var(--gold))',
              }}
              title="Active tab"
            />
            <span
              className="memory-bar__seg"
              style={{
                width: `${(stats.awakeMB / stats.total) * 100}%`,
                background: 'var(--muted)',
                opacity: 0.55,
              }}
              title="Other awake tabs"
            />
            <span
              className="memory-bar__seg"
              style={{
                width: `${(stats.sleepingMB / stats.total) * 100}%`,
                background: 'var(--accent)',
                opacity: 0.75,
              }}
              title="Sleeping tabs"
            />
          </div>

          <div className="memory-legend">
            <span className="memory-legend__item">
              <i className="memory-legend__dot" style={{ background: 'var(--line-strong)' }} /> Star chrome
            </span>
            <span className="memory-legend__item">
              <i className="memory-legend__dot" style={{ background: 'var(--gold)' }} /> This tab
            </span>
            <span className="memory-legend__item">
              <i className="memory-legend__dot" style={{ background: 'var(--muted)' }} /> Awake tabs
            </span>
            <span className="memory-legend__item">
              <i className="memory-legend__dot" style={{ background: 'var(--accent)' }} /> Sleeping
            </span>
          </div>

          <div className="memory-list">
            {state.tabs.map((tab) => {
              const info = faviconInfo(tab.url)
              const Icon = tab.sleeping ? Moon : info.icon
              return (
                <div className="memory-row" key={tab.id}>
                  <span
                    className="memory-row__icon"
                    style={{ '--fa': info.accent[0], '--fb': info.accent[1] } as React.CSSProperties}
                  >
                    <Icon size={10} strokeWidth={2.4} />
                  </span>
                  <span className="memory-row__name">{tab.title}</span>
                  {tab.id === state.activeId && <span className="tab-row__badge" data-kind="active">active</span>}
                  {tab.sleeping && <span className="tab-row__badge">asleep</span>}
                  <span className="memory-row__mb" data-sleeping={tab.sleeping}>
                    {tab.sleeping ? `${SLEEPING_MEMORY_MB} MB` : memoryLabel(tab.memoryMB)}
                  </span>
                  {!tab.sleeping && tab.id !== state.activeId && (
                    <button
                      className="memory-row__sleep"
                      title="Put this tab to sleep"
                      onClick={() => sleepTab(tab.id)}
                    >
                      <Snowflake size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="memory-panel__actions">
            <button className="btn btn--sm btn--primary" onClick={() => { hibernateWithUndo(); setOpen(false) }}>
              <Leaf size={12} /> Hibernate idle tabs
            </button>
            <button
              className="btn btn--sm"
              onClick={() => {
                navigate('star://settings#memory')
                setOpen(false)
              }}
            >
              <Settings2 size={12} /> Manage
            </button>
          </div>

          <div className="memory-panel__saved">
            <Snowflake size={10} />
            <span>
              About <strong>{memoryLabel(state.stats.ramSavedMB + stats.potential)}</strong> in reach ·{' '}
              {state.stats.hibernated} tabs hibernated so far
            </span>
            <ArrowUpRight size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
          </div>
        </div>
      )}
    </div>
  )
}
