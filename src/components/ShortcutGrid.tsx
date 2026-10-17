export interface Shortcut {
  label: string
  keys: string[]
}

export const SHORTCUTS: Shortcut[] = [
  { label: 'New tab', keys: ['t'] },
  { label: 'Search the constellation', keys: ['/'] },
  { label: 'Command palette', keys: ['⌘', 'K'] },
  { label: 'History', keys: ['h'] },
  { label: 'Bookmarks', keys: ['b'] },
  { label: 'Settings', keys: [','] },
  { label: 'Hibernate idle tabs', keys: ['m'] },
  { label: 'Zen mode', keys: ['z'] },
  { label: 'Reopen last closed tab', keys: ['u'] },
  { label: 'Jump to tab 1 – 9', keys: ['1', '…', '9'] },
  { label: 'Keyboard shortcuts', keys: ['?'] },
  { label: 'Close menus or exit zen', keys: ['Esc'] },
]

export function ShortcutGrid({ compact = false }: { compact?: boolean }) {
  const items = compact ? SHORTCUTS.slice(0, 8) : SHORTCUTS
  return (
    <div className="shortcut-grid">
      {items.map((shortcut) => (
        <div className="shortcut-row" key={shortcut.label}>
          <span>{shortcut.label}</span>
          <span className="shortcut-keys">
            {shortcut.keys.map((key) => (
              <kbd key={key}>{key}</kbd>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}
