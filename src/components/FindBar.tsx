import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { navController } from '../lib/navigation'

interface FindResult {
  tabId: string
  matches: number
  activeMatchOrdinal: number
}

/** Chrome-style find in page, wired to the guest's real findInPage(). */
export function FindBar({ onClose }: { onClose: () => void }) {
  const { activeTab } = useBrowser()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<{ matches: number; active: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const firstRun = useRef(true)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<FindResult>).detail
      if (detail.tabId !== activeTab.id) return
      setResult({ matches: detail.matches, active: detail.activeMatchOrdinal })
    }
    window.addEventListener('star:find-result', handler)
    return () => window.removeEventListener('star:find-result', handler)
  }, [activeTab.id])

  useEffect(() => {
    const controller = navController(activeTab.id)
    if (!controller) return
    if (!query) {
      controller.stopFind('clearSelection')
      setResult(null)
      return
    }
    // First keystrokes start a session; later ones continue from here.
    controller.find(query, { forward: true, findNext: firstRun.current })
    firstRun.current = false
  }, [query, activeTab.id])

  // Leaving the bar clears the page's highlights.
  useEffect(() => {
    const tabId = activeTab.id
    return () => {
      navController(tabId)?.stopFind('clearSelection')
    }
  }, [activeTab.id])

  const step = (forward: boolean) => {
    const controller = navController(activeTab.id)
    if (!controller || !query) return
    controller.find(query, { forward, findNext: false })
  }

  return (
    <div className="findbar" role="search">
      <span className="findbar__icon">
        <Search size={13} />
      </span>
      <input
        ref={inputRef}
        className="findbar__input"
        value={query}
        placeholder="Find in page"
        aria-label="Find in page"
        onChange={(event) => {
          firstRun.current = true
          setQuery(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            step(!event.shiftKey)
          } else if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
          }
        }}
      />
      <span className="findbar__count">
        {query ? (result && result.matches > 0 ? `${result.active}/${result.matches}` : '0/0') : ''}
      </span>
      <button className="findbar__btn" onClick={() => step(false)} aria-label="Previous match" disabled={!query}>
        <ChevronUp size={13} />
      </button>
      <button className="findbar__btn" onClick={() => step(true)} aria-label="Next match" disabled={!query}>
        <ChevronDown size={13} />
      </button>
      <button className="findbar__btn findbar__btn--close" onClick={onClose} aria-label="Close find bar">
        <X size={13} />
      </button>
    </div>
  )
}
