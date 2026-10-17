import { useEffect, useState } from 'react'
import { Command, Leaf, Moon } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { displayAddress } from '../lib/url'
import { formatClock, memoryLabel } from '../lib/utils'
import { useMemoryStats } from './MemoryPanel'

export function StatusBar() {
  const { state, activeTab, navigate } = useBrowser()
  const stats = useMemoryStats()
  const [, setTick] = useState(0)
  const sleepers = state.tabs.filter((t) => t.sleeping).length

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <footer className="statusbar">
      <div className="statusbar__group">
        <span className="statusbar__item">
          <span className="statusbar__dot" />
          local
        </span>
        <span className="statusbar__item" style={{ color: 'var(--muted)' }}>
          {displayAddress(activeTab.url)}
        </span>
        <span className="statusbar__item">
          {state.tabs.length} {state.tabs.length === 1 ? 'tab' : 'tabs'}
          {sleepers > 0 && (
            <>
              {' '}· {sleepers} asleep
            </>
          )}
        </span>
      </div>
      <div className="statusbar__group">
        <button
          className="statusbar__action tooltip"
          data-tip={`${memoryLabel(stats.total)} used right now`}
          onClick={() => navigate('star://settings#memory')}
        >
          <Leaf size={10} /> {memoryLabel(state.stats.ramSavedMB)} saved
        </button>
        <span className="statusbar__item">
          <Moon size={10} /> {state.stats.hibernated} hibernated
        </span>
        <button className="statusbar__action" onClick={() => navigate('star://settings')}>
          {state.settings.memorySaver ? 'memory saver on' : 'memory saver off'}
        </button>
        <span className="statusbar__item tooltip" data-tip="Open commands">
          <Command size={10} /> K
        </span>
        <span className="statusbar__item">{formatClock()}</span>
      </div>
    </footer>
  )
}
