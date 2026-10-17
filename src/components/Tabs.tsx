import { useEffect, useState } from 'react'
import {
  Bookmark,
  Copy,
  Moon,
  Plus,
  RotateCw,
  X,
} from 'lucide-react'
import { useBrowser } from '../store/browser'
import { faviconInfo } from '../lib/sites'
import type { Tab } from '../lib/types'

interface MenuState {
  tab: Tab
  x: number
  y: number
}

export function Brand() {
  return (
    <div className="brand" aria-label="Star Browser">
      <span className="brand__mark">
        <StarGlyph />
      </span>
      <span className="brand__name">
        <em>Star</em> Browser
      </span>
    </div>
  )
}

function StarGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 1.6c1.05 5.72 4.68 9.35 10.4 10.4-5.72 1.05-9.35 4.68-10.4 10.4-1.05-5.72-4.68-9.35-10.4-10.4C7.32 10.95 10.95 7.32 12 1.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function TabStrip() {
  const { state, activateTab, closeTab, newTab, navigate, sleepTab, toggleBookmark, closeOthers, toast } =
    useBrowser()
  const [menu, setMenu] = useState<MenuState | null>(null)

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null)
    document.addEventListener('mousedown', close)
    document.addEventListener('scroll', close, true)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('scroll', close, true)
      document.removeEventListener('keydown', esc)
    }
  }, [menu])

  return (
    <>
      <div className="tabstrip" role="tablist" aria-label="Open tabs">
        {state.tabs.map((tab) => {
          const info = faviconInfo(tab.url)
          const Icon = info.icon
          const active = tab.id === state.activeId
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              className="tab"
              data-active={active}
              data-sleeping={tab.sleeping}
              title={tab.sleeping ? `${tab.title} (asleep)` : tab.title}
              onClick={() => activateTab(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  activateTab(tab.id)
                }
              }}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault()
                  closeTab(tab.id)
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                setMenu({
                  tab,
                  x: Math.min(e.clientX, window.innerWidth - 210),
                  y: Math.min(e.clientY, window.innerHeight - 280),
                })
              }}
            >
              <span
                className="tab__favicon"
                style={{ '--fa': info.accent[0], '--fb': info.accent[1] } as React.CSSProperties}
              >
                {tab.sleeping ? <Moon size={11} strokeWidth={2.4} /> : <Icon size={11} strokeWidth={2.4} />}
              </span>
              <span className="tab__title">{tab.title || 'New Tab'}</span>
              {tab.sleeping && <span className="tab__sleep-badge">z z</span>}
              <button
                className="tab__close"
                aria-label={`Close ${tab.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
              >
                <X size={12} strokeWidth={2.4} />
              </button>
            </div>
          )
        })}
        <button className="tab tab--new" onClick={() => newTab()} title="New tab (t)" aria-label="New tab">
          <Plus size={16} strokeWidth={2.2} />
        </button>
        <span className="tabstrip__spacer" />
      </div>

      {menu && (
        <div
          className="context-menu"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="menu-item"
            onClick={() => {
              if (menu.tab.id !== state.activeId) activateTab(menu.tab.id)
              navigate(menu.tab.url)
              setMenu(null)
            }}
          >
            <RotateCw size={13} /> Reload tab
          </button>
          <button
            className="menu-item"
            onClick={() => {
              newTab(menu.tab.url)
              setMenu(null)
            }}
          >
            <Copy size={13} /> Duplicate tab
          </button>
          <button
            className="menu-item"
            onClick={() => {
              toggleBookmark(menu.tab.url, menu.tab.title)
              setMenu(null)
            }}
          >
            <Bookmark size={13} /> Bookmark page
          </button>
          <button
            className="menu-item"
            disabled={menu.tab.sleeping || menu.tab.id === state.activeId}
            onClick={() => {
              sleepTab(menu.tab.id)
              toast(`${menu.tab.title} is now hibernating`, { icon: 'moon' })
              setMenu(null)
            }}
          >
            <Moon size={13} /> Hibernate tab
          </button>
          <div className="menu-sep" />
          <button
            className="menu-item"
            onClick={() => {
              closeTab(menu.tab.id)
              setMenu(null)
            }}
          >
            <X size={13} /> Close tab
          </button>
          <button
            className="menu-item"
            onClick={() => {
              closeOthers(menu.tab.id)
              setMenu(null)
            }}
          >
            <X size={13} /> Close other tabs
          </button>
        </div>
      )}
    </>
  )
}
