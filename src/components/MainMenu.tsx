import { useEffect, useState } from 'react'
import {
  Bookmark,
  CircleHelp,
  Command,
  History,
  Info,
  Leaf,
  Menu as MenuIcon,
  Moon,
  Plus,
  Settings,
  Sparkles,
  Sun,
  Laptop,
  Keyboard,
  Cpu,
} from 'lucide-react'
import { useBrowser } from '../store/browser'
import { useClickOutside } from '../lib/hooks'
import type { ThemeId } from '../lib/types'
import { engineLabel } from '../lib/desktop'

const THEMES: Array<{ id: ThemeId; label: string; icon: typeof Moon }> = [
  { id: 'midnight', label: 'Midnight', icon: Moon },
  { id: 'eclipse', label: 'Eclipse', icon: Sparkles },
  { id: 'daylight', label: 'Daylight', icon: Sun },
]

export function MainMenu({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { state, navigate, newTab, hibernateWithUndo, toggleZen, setTheme, updateSettings, toast } = useBrowser()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open)

  // Navigating from anywhere (keyboard, tab switch) closes the menu.
  useEffect(() => {
    setOpen(false)
  }, [state.activeId])

  const go = (url: string) => {
    navigate(url)
    setOpen(false)
  }

  return (
    <div className="popover-anchor" ref={ref}>
      <button
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        title="Star menu"
        aria-label="Star menu"
        aria-expanded={open}
      >
        <MenuIcon size={17} />
      </button>
      {open && (
        <div className="popover">
          <button
            className="menu-item"
            onClick={() => {
              newTab()
              setOpen(false)
            }}
          >
            <Plus size={14} /> New tab <span className="menu-item__kbd"><kbd>t</kbd></span>
          </button>
          <button
            className="menu-item"
            onClick={() => {
              onOpenPalette()
              setOpen(false)
            }}
          >
            <Command size={14} /> Command palette <span className="menu-item__kbd"><kbd>⌘</kbd><kbd>K</kbd></span>
          </button>
          <div className="menu-sep" />
          <button className="menu-item" onClick={() => go('star://bookmarks')}>
            <Bookmark size={14} /> Bookmarks
          </button>
          <button className="menu-item" onClick={() => go('star://history')}>
            <History size={14} /> History
          </button>
          <button className="menu-item" onClick={() => go('docs.star')}>
            <CircleHelp size={14} /> Star guide
          </button>
          <button className="menu-item" onClick={() => go('star://settings')}>
            <Settings size={14} /> Settings <span className="menu-item__kbd"><kbd>,</kbd></span>
          </button>
          <div className="menu-sep" />
          <button
            className="menu-item"
            onClick={() => {
              hibernateWithUndo()
              setOpen(false)
            }}
          >
            <Leaf size={14} /> Hibernate idle tabs <span className="menu-item__kbd"><kbd>m</kbd></span>
          </button>
          <button
            className="menu-item"
            onClick={() => {
              toggleZen()
              setOpen(false)
            }}
          >
            <Sparkles size={14} /> Zen mode <span className="menu-item__kbd"><kbd>z</kbd></span>
          </button>
          <div className="menu-sep" />
          <div className="menu-label">Theme</div>
          <div className="menu-themes">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className="theme-swatch"
                data-theme={t.id}
                data-active={state.settings.theme === t.id}
                title={t.label}
                aria-label={`${t.label} theme`}
                onClick={() => {
                  setTheme(t.id)
                  toast(`${t.label} theme applied`, { icon: 'star' })
                  setOpen(false)
                }}
              />
            ))}
          </div>
          <div className="menu-sep" />
          <button
            className="menu-item"
            onClick={() => {
              updateSettings({ memorySaver: !state.settings.memorySaver })
              toast(state.settings.memorySaver ? 'Memory saver paused' : 'Memory saver on', { icon: 'moon' })
            }}
          >
            {state.settings.memorySaver ? <Leaf size={14} /> : <Laptop size={14} />}
            Memory saver: {state.settings.memorySaver ? 'on' : 'off'}
          </button>
          <button className="menu-item" onClick={() => go('star://chromium')}>
            <Cpu size={14} /> Engine
            <span className="menu-item__kbd">{engineLabel()}</span>
          </button>
          <button className="menu-item" onClick={() => go('star://about')}>
            <Info size={14} /> About Star Browser
          </button>
          <button className="menu-item" onClick={() => go('star://about#shortcuts')}>
            <Keyboard size={14} /> Keyboard shortcuts <span className="menu-item__kbd"><kbd>?</kbd></span>
          </button>
        </div>
      )}
    </div>
  )
}
