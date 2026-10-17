import { ChevronRight, Plus, Star } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { faviconInfo } from '../lib/sites'

export function BookmarksBar() {
  const { state, navigate, activeTab, toggleBookmark } = useBrowser()
  const shown = state.bookmarks.slice(0, 9)
  const overflow = state.bookmarks.length - shown.length

  return (
    <div className="bookmarksbar" aria-label="Bookmarks bar">
      {shown.length === 0 && (
        <span className="bookmarksbar__empty">
          <Star size={11} />
          Starred pages appear here.
        </span>
      )}
      {shown.map((bookmark) => {
        const info = faviconInfo(bookmark.url)
        const Icon = info.icon
        return (
          <button
            key={bookmark.id}
            className="bookmark-chip"
            onClick={() => navigate(bookmark.url)}
            title={`${bookmark.title}\n${bookmark.url}`}
          >
            <span
              className="bookmark-chip__fav"
              style={{ '--fa': info.accent[0], '--fb': info.accent[1] } as React.CSSProperties}
            >
              <Icon size={9} strokeWidth={2.6} />
            </span>
            <span>{bookmark.title}</span>
          </button>
        )
      })}
      {overflow > 0 && (
        <button className="bookmarksbar__more" onClick={() => navigate('star://bookmarks')}>
          +{overflow} more
        </button>
      )}
      <button
        className="bookmarksbar__more"
        style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        onClick={() => toggleBookmark(activeTab.url, activeTab.title)}
        title="Add the current page to your bookmarks"
      >
        <Plus size={11} /> add
        <ChevronRight size={10} style={{ opacity: 0.4 }} />
      </button>
    </div>
  )
}
