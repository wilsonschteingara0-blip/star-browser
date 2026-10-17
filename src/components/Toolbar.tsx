import {
  ArrowLeft,
  ArrowRight,
  Command,
  Leaf,
  RotateCw,
  Sparkles,
  Star,
  StarOff,
} from 'lucide-react'
import { useBrowser } from '../store/browser'
import { Omnibox } from './Omnibox'
import { useMemoryStats } from './MemoryPanel'
import { memoryLabel } from '../lib/utils'

export function Toolbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const {
    state,
    activeTab,
    back,
    forward,
    reload,
    toggleBookmark,
    hibernateWithUndo,
    toggleZen,
    isBookmarked,
  } = useBrowser()
  const stats = useMemoryStats()
  const bookmarked = isBookmarked(activeTab.url)
  const awake = state.tabs.filter((t) => !t.sleeping && t.kind !== 'internal').length

  return (
    <div className="toolbar">
      <div className="toolbar__nav">
        <button
          className="icon-btn tooltip"
          data-tip="Back"
          onClick={back}
          disabled={activeTab.back.length === 0}
          aria-label="Back"
        >
          <ArrowLeft size={17} />
        </button>
        <button
          className="icon-btn tooltip"
          data-tip="Forward"
          onClick={forward}
          disabled={activeTab.forward.length === 0}
          aria-label="Forward"
        >
          <ArrowRight size={17} />
        </button>
        <button className="icon-btn tooltip" data-tip="Reload" onClick={reload} aria-label="Reload">
          <RotateCw size={15} />
        </button>
      </div>

      <Omnibox />

      <div className="toolbar__nav">
        <button
          className="icon-btn tooltip"
          data-tip={bookmarked ? 'Remove bookmark' : 'Bookmark this page'}
          data-active={bookmarked}
          onClick={() => toggleBookmark()}
          aria-label="Bookmark this page"
        >
          {bookmarked ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
        </button>
        <button
          className="icon-btn tooltip"
          data-tip={`Hibernate idle tabs · ${memoryLabel(stats.potential)} reclaimable`}
          onClick={() => hibernateWithUndo()}
          aria-label="Hibernate idle tabs"
        >
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <Leaf size={16} />
            {awake > 1 && (
              <span
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -7,
                  fontSize: 8,
                  fontWeight: 700,
                  color: 'var(--gold)',
                  background: 'var(--elevated)',
                  borderRadius: 99,
                  padding: '0 3px',
                  border: '1px solid var(--line)',
                  lineHeight: 1.5,
                }}
              >
                {awake}
              </span>
            )}
          </span>
        </button>
        <button
          className="icon-btn tooltip"
          data-tip="Zen mode (z)"
          onClick={toggleZen}
          aria-label="Zen mode"
        >
          <Sparkles size={16} />
        </button>
        <button
          className="icon-btn tooltip"
          data-tip="Commands (⌘K)"
          onClick={onOpenPalette}
          aria-label="Open command palette"
        >
          <Command size={16} />
        </button>
      </div>
    </div>
  )
}
