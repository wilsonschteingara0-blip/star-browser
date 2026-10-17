import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Cpu,
  Download,
  Info,
  Leaf,
  Moon,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Sparkles,
  Trash2,
  ArrowUpRight,
  Globe,
} from 'lucide-react'
import { useBrowser } from '../store/browser'
import { useMemoryStats, CHROME_MEMORY_MB } from '../components/MemoryPanel'
import { SEARCH_ENGINES } from '../lib/sites'
import { faviconInfo } from '../lib/sites'
import { exportBrowserData, eraseEverything } from '../lib/data'
import { memoryLabel } from '../lib/utils'
import {
  CHROMIUM_GITHUB,
  ELECTRON_GITHUB,
  chromiumVersion,
  electronVersion,
  engineLabel,
  isDesktop,
  openExternalUrl,
} from '../lib/desktop'
import type { ThemeId } from '../lib/types'
import { MoonStar } from 'lucide-react'

const THEMES: Array<{ id: ThemeId; label: string; hint: string; glow: string }> = [
  { id: 'midnight', label: 'Midnight', hint: 'deep space', glow: 'rgba(255,196,110,.5)' },
  { id: 'eclipse', label: 'Eclipse', hint: 'plum & rose', glow: 'rgba(255,140,196,.5)' },
  { id: 'daylight', label: 'Daylight', hint: 'warm paper', glow: 'rgba(255,180,110,.55)' },
]

const NAV = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'memory', label: 'Memory', icon: Cpu },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'privacy', label: 'Privacy & data', icon: ShieldCheck },
  { id: 'engine', label: 'Engine', icon: Globe },
  { id: 'about', label: 'About', icon: Info },
]

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button className="toggle" data-on={on} aria-pressed={on} aria-label={label} onClick={() => onChange(!on)} />
  )
}

export function SettingsPage({ url }: { url: string }) {
  const {
    state,
    activeTab,
    updateSettings,
    setTheme,
    hibernateWithUndo,
    sleepTab,
    wakeTab,
    navigate,
    toast,
    clearHistory,
  } = useBrowser()
  const mem = useMemoryStats()
  const [section, setSection] = useState(() => url.split('#')[1] ?? 'appearance')

  useEffect(() => {
    const hash = url.split('#')[1]
    if (hash) {
      setSection(hash)
      window.setTimeout(() => {
        document.getElementById(`settings-${hash}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    }
  }, [url])

  const go = (id: string) => {
    setSection(id)
    document.getElementById(`settings-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const awake = state.tabs.filter((t) => !t.sleeping).length
  const sleeping = state.tabs.length - awake

  const memoryRows = useMemo(
    () =>
      [...state.tabs].sort((a, b) => {
        if (a.id === state.activeId) return -1
        if (b.id === state.activeId) return 1
        return Number(a.sleeping) - Number(b.sleeping)
      }),
    [state.tabs, state.activeId],
  )

  return (
    <div className="settings-page">
      <aside className="settings-nav">
        <div className="settings-nav__group">Star Browser</div>
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className="settings-nav__item"
              data-active={section === item.id}
              onClick={() => go(item.id)}
            >
              <Icon size={14} /> {item.label}
            </button>
          )
        })}
        <div className="settings-nav__group">Shortcuts</div>
        <button className="settings-nav__item" onClick={() => navigate('star://about#shortcuts')}>
          <Sparkles size={14} /> All shortcuts
        </button>
        <button className="settings-nav__item" onClick={() => navigate('docs.star')}>
          <ArrowUpRight size={14} /> Read the guide
        </button>
      </aside>

      <div className="settings-content">
        <div className="page__head" style={{ marginBottom: 4 }}>
          <div>
            <div className="page__eyebrow">
              <Settings size={11} /> Make it yours
            </div>
            <h1 className="page__title" style={{ fontSize: 38 }}>
              Settings
            </h1>
            <p className="page__sub">
              A few quiet dials. Everything here is stored locally and applies immediately.
            </p>
          </div>
          <span className="about-version">v1.1.0</span>
        </div>

        <section className="settings-section" id="settings-appearance">
          <div className="settings-section__head">
            <span className="settings-section__icon">
              <Palette size={15} />
            </span>
            <div>
              <div className="settings-section__title">Appearance</div>
              <div className="settings-section__sub">Three moods for the same quiet sky.</div>
            </div>
          </div>

          <div className="theme-grid">
            {THEMES.map((theme) => {
              const active = state.settings.theme === theme.id
              return (
                <button
                  key={theme.id}
                  className="theme-card"
                  data-active={active}
                  onClick={() => {
                    setTheme(theme.id)
                    toast(`${theme.label} theme applied`, { icon: 'star' })
                  }}
                >
                  <div className="theme-card__preview" data-theme={theme.id}>
                    <span className="theme-card__glow" style={{ background: theme.glow }} />
                  </div>
                  <div className="theme-card__name">
                    <span>{theme.label}</span>
                    {active ? <span className="theme-card__check">●</span> : <small>{theme.hint}</small>}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Show the bookmarks bar</div>
              <div className="settings-row__desc">A slim shelf of stars under the address bar.</div>
            </div>
            <Toggle
              on={state.settings.bookmarksBar}
              onChange={(v) => updateSettings({ bookmarksBar: v })}
              label="Show bookmarks bar"
            />
          </div>
          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Reduce motion</div>
              <div className="settings-row__desc">
                Stills the drifting aurora and page transitions. Good for slower machines and busy eyes.
              </div>
            </div>
            <Toggle
              on={state.settings.reduceMotion}
              onChange={(v) => updateSettings({ reduceMotion: v })}
              label="Reduce motion"
            />
          </div>
        </section>

        <section className="settings-section" id="settings-memory">
          <div className="settings-section__head">
            <span className="settings-section__icon">
              <Leaf size={15} />
            </span>
            <div>
              <div className="settings-section__title">Memory</div>
              <div className="settings-section__sub">
                The whole point. Idle tabs drift off; clicking one wakes it exactly where it was.
              </div>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Memory saver</div>
              <div className="settings-row__desc">
                Automatically hibernate background tabs. Foreground tab is never touched.
              </div>
            </div>
            <Toggle
              on={state.settings.memorySaver}
              onChange={(v) => {
                updateSettings({ memorySaver: v })
                toast(v ? 'Memory saver on — idle tabs will rest' : 'Memory saver paused', { icon: 'moon' })
              }}
              label="Memory saver"
            />
          </div>

          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Put idle tabs to sleep after</div>
              <div className="settings-row__desc">A tab wakes the moment you click it.</div>
            </div>
            <select
              className="select"
              value={state.settings.autoSleepMinutes}
              onChange={(e) => updateSettings({ autoSleepMinutes: Number(e.target.value) })}
              disabled={!state.settings.memorySaver}
            >
              <option value={1}>1 minute</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>

          <div className="settings-stat-row">
            <div className="stat-tile">
              <div className="stat-tile__label">Used right now</div>
              <div className="stat-tile__value">
                {Math.round(mem.total)}
                <small>MB</small>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile__label">Saved so far</div>
              <div className="stat-tile__value" style={{ color: 'var(--good)' }}>
                {Math.round(state.stats.ramSavedMB)}
                <small>MB</small>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile__label">Tabs hibernated</div>
              <div className="stat-tile__value">{state.stats.hibernated}</div>
            </div>
          </div>

          <div className="settings-row" style={{ paddingBottom: 4 }}>
            <div className="settings-row__text">
              <div className="settings-row__label">Live tabs</div>
              <div className="settings-row__desc">
                {awake} awake · {sleeping} asleep · Star chrome accounts for {CHROME_MEMORY_MB} MB
              </div>
            </div>
            <button className="btn btn--sm btn--primary" onClick={() => hibernateWithUndo()}>
              <Moon size={12} /> Hibernate idle
            </button>
          </div>

          <div className="tab-table">
            {memoryRows.map((tab) => {
              const info = faviconInfo(tab.url)
              const Icon = tab.sleeping ? MoonStar : info.icon
              return (
                <div className="tab-row" key={tab.id}>
                  <span
                    className="tab-row__fav"
                    style={{ '--fa': info.accent[0], '--fb': info.accent[1] } as React.CSSProperties}
                  >
                    <Icon size={10} strokeWidth={2.4} />
                  </span>
                  <span className="tab-row__name">{tab.title}</span>
                  {tab.id === state.activeId && <span className="tab-row__badge" data-kind="active">active</span>}
                  {tab.sleeping && <span className="tab-row__badge">asleep</span>}
                  <span className="tab-row__mb" data-sleeping={tab.sleeping}>
                    {tab.sleeping ? '9 MB' : memoryLabel(tab.memoryMB)}
                  </span>
                  {tab.sleeping ? (
                    <button className="icon-btn tooltip" data-tip="Wake tab" onClick={() => wakeTab(tab.id)}>
                      <Sun size={12} />
                    </button>
                  ) : (
                    <button
                      className="icon-btn tooltip"
                      data-tip="Hibernate now"
                      onClick={() => sleepTab(tab.id)}
                      disabled={tab.id === state.activeId}
                    >
                      <Moon size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ padding: '0 18px 14px', fontSize: 10.5, color: 'var(--faint)', lineHeight: 1.6 }}>
            {isDesktop()
              ? "External tabs are measured from the Chromium renderer process that owns them. Hibernating a tab destroys that process; the saved figure is the memory that actually went back to your machine. Star's own shell baseline is still a conservative model."
              : "Memory figures are Star's own model, tuned to typical per-tab costs. A web preview can't read process memory. In the desktop app, Chromium's real counters replace the model — and hibernation destroys the renderer for real."}
          </div>
        </section>

        <section className="settings-section" id="settings-search">
          <div className="settings-section__head">
            <span className="settings-section__icon">
              <Search size={15} />
            </span>
            <div>
              <div className="settings-section__title">Search</div>
              <div className="settings-section__sub">
                {isDesktop()
                  ? 'Star Search answers from the constellation and your own pages. Other engines open in a Chromium tab.'
                  : 'Star Search answers from the constellation and your own pages. Other engines hand the query to your system browser.'}
              </div>
            </div>
          </div>
          <div className="settings-row settings-row--stack">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
              {SEARCH_ENGINES.map((engine) => {
                const Icon = engine.icon
                const active = state.settings.searchEngine === engine.id
                return (
                  <button
                    key={engine.id}
                    onClick={() => updateSettings({ searchEngine: engine.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1px solid ${active ? 'color-mix(in srgb, var(--gold) 40%, transparent)' : 'var(--line)'}`,
                      background: active ? 'var(--gold-soft)' : 'var(--chips)',
                      textAlign: 'left',
                    }}
                  >
                    <Icon size={15} color={active ? 'var(--gold)' : 'var(--muted)'} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 550, color: active ? 'var(--gold)' : 'var(--text-2)' }}>
                        {engine.label}
                      </span>
                      <span style={{ display: 'block', fontSize: 9.5, color: 'var(--faint)' }}>{engine.hint}</span>
                    </span>
                    {active && <span style={{ color: 'var(--gold)', fontSize: 11 }}>●</span>}
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--faint)', lineHeight: 1.6 }}>
              {isDesktop()
                ? 'Searching with Google, DuckDuckGo or Bing opens that page in a Chromium tab inside Star. Star itself never sends your keystrokes to a search engine.'
                : 'Searching with Google, DuckDuckGo or Bing opens the search in your system browser through the portal. The desktop app keeps it in a Chromium tab instead.'}
            </div>
          </div>
        </section>

        <section className="settings-section" id="settings-privacy">
          <div className="settings-section__head">
            <span className="settings-section__icon">
              <ShieldCheck size={15} />
            </span>
            <div>
              <div className="settings-section__title">Privacy & data</div>
              <div className="settings-section__sub">No account. No sync. No telemetry. Just this machine.</div>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Restore my tabs next time</div>
              <div className="settings-row__desc">
                Reopens the tabs you left behind when Star starts again.
              </div>
            </div>
            <Toggle
              on={state.settings.restoreSession}
              onChange={(v) => updateSettings({ restoreSession: v })}
              label="Restore tabs"
            />
          </div>

          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Export everything</div>
              <div className="settings-row__desc">
                Bookmarks, history, open tabs and settings as a single readable JSON file.
              </div>
            </div>
            <button
              className="btn btn--sm"
              onClick={() => {
                exportBrowserData(state)
                toast('Star data exported', { icon: 'check' })
              }}
            >
              <Download size={12} /> Export
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Clear browsing history</div>
              <div className="settings-row__desc">{state.history.length} entries — bookmarks are untouched.</div>
            </div>
            <button
              className="btn btn--sm"
              onClick={() => {
                clearHistory()
                toast('History cleared', { icon: 'check' })
              }}
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>

          <div className="danger-zone">
            <div>
              <div className="settings-row__label" style={{ color: 'var(--bad)' }}>
                Erase all Star data
              </div>
              <div className="settings-row__desc">
                Deletes bookmarks, history, notes, mail state and settings from this browser. This
                can't be undone.
              </div>
            </div>
            <button
              className="btn btn--sm btn--danger"
              onClick={() => {
                if (
                  window.confirm(
                    'Erase all Star Browser data on this device? Bookmarks, history, notes and mail will be gone.',
                  )
                ) {
                  eraseEverything()
                }
              }}
            >
              <AlertTriangle size={12} /> Erase everything
            </button>
          </div>
        </section>

        <section className="settings-section" id="settings-engine">
          <div className="settings-section__head">
            <span className="settings-section__icon">
              <Globe size={15} />
            </span>
            <div>
              <div className="settings-section__title">Engine</div>
              <div className="settings-section__sub">
                Chromium does the rendering. Star keeps it quiet.
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="engine-panel">
              <span className="engine-panel__mark">
                <Globe size={18} />
              </span>
              <div className="engine-panel__text">
                <div className="engine-panel__name">{engineLabel()}</div>
                <div className="engine-panel__sub">
                  {isDesktop()
                    ? 'The open-source engine behind Chrome, running every external tab as a sandboxed guest process.'
                    : 'The desktop app runs Star on Chromium. This preview is using your browser and hands external pages over.'}
                </div>
              </div>
              <div className="engine-facts">
                <div className="engine-fact">
                  <span className="engine-fact__label">Chromium</span>
                  <span className="engine-fact__value">
                    {isDesktop() ? chromiumVersion() : 'desktop app'}
                  </span>
                </div>
                <div className="engine-fact">
                  <span className="engine-fact__label">Electron</span>
                  <span className="engine-fact__value">
                    {isDesktop() ? electronVersion() : '→ npm run desktop'}
                  </span>
                </div>
                <div className="engine-fact">
                  <span className="engine-fact__label">Licence</span>
                  <span className="engine-fact__value">BSD-3-Clause</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <button className="btn btn--sm" onClick={() => openExternalUrl(CHROMIUM_GITHUB)}>
                chromium/chromium <ArrowUpRight size={12} />
              </button>
              <button className="btn btn--sm" onClick={() => openExternalUrl(ELECTRON_GITHUB)}>
                electron/electron <ArrowUpRight size={12} />
              </button>
              <button className="btn btn--sm" onClick={() => navigate('star://about#engine')}>
                About the engine
              </button>
            </div>

            <div className="engine-note">
              <ShieldCheck size={11} />
              <span>
                Guests run with context isolation on, Node off, a shared persistent session and a
                permission handler that only grants fullscreen and clipboard writes. No preload, no
                bridge, no extension surface.
              </span>
            </div>
          </div>
        </section>

        <section className="settings-section" id="settings-about">
          <div className="settings-section__head">
            <span className="settings-section__icon">
              <Info size={15} />
            </span>
            <div>
              <div className="settings-section__title">About Star Browser</div>
              <div className="settings-section__sub">Version 1.1.0 · the constellation edition</div>
            </div>
          </div>
          <div className="danger-zone">
            <div>
              <div className="settings-row__label">Curious what makes it tick?</div>
              <div className="settings-row__desc">
                The manual covers hibernation, shortcuts, privacy, and what Star honestly is.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button className="btn btn--sm" onClick={() => navigate('docs.star')}>
                Star guide
              </button>
              <button className="btn btn--sm" onClick={() => navigate('star://about')}>
                About <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
