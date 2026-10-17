import { ArrowUpRight, Bookmark, Star, X } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { faviconInfo } from '../lib/sites'
import { timeAgo } from '../lib/utils'

export function BookmarksPage() {
  const { state, navigate, removeBookmark, toast } = useBrowser()

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__eyebrow">
            <Star size={11} /> Kept close
          </div>
          <h1 className="page__title">Bookmarks</h1>
          <p className="page__sub">
            Pages you have decided to keep. They live in this browser, on this device, and nowhere else.
          </p>
        </div>
        <div className="page__actions">
          <span className="chip" style={{ cursor: 'default' }}>
            <Bookmark size={11} /> {state.bookmarks.length} saved
          </span>
        </div>
      </div>

      {state.bookmarks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">
            <Star size={20} />
          </span>
          <h3>No stars pinned yet</h3>
          <p>
            Open any page and press the star in the toolbar — or hit the star next to the address bar.
            Bookmarked pages also show up in your bookmarks bar.
          </p>
        </div>
      ) : (
        <div className="bookmark-grid">
          {state.bookmarks.map((bookmark) => {
            const info = faviconInfo(bookmark.url)
            const Icon = info.icon
            return (
              <div key={bookmark.id} className="bookmark-card">
                <button
                  style={{ display: 'block', width: '100%', textAlign: 'left' }}
                  onClick={() => navigate(bookmark.url)}
                >
                  <div className="bookmark-card__top">
                    <span
                      className="bookmark-card__fav"
                      style={{ '--fa': info.accent[0], '--fb': info.accent[1] } as React.CSSProperties}
                    >
                      <Icon size={15} strokeWidth={2.2} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="bookmark-card__title">{bookmark.title}</div>
                      <span className="bookmark-card__url">{bookmark.url}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9.5, color: 'var(--faint)' }}>
                      saved {timeAgo(bookmark.addedAt)}
                    </span>
                    <ArrowUpRight size={12} color="var(--faint)" />
                  </div>
                </button>
                <button
                  className="bookmark-card__remove"
                  aria-label={`Remove ${bookmark.title}`}
                  title="Remove bookmark"
                  onClick={() => {
                    removeBookmark(bookmark.id)
                    toast('Bookmark removed', { icon: 'check' })
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 28, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        <button className="chip" onClick={() => navigate('nebula.star')}>
          <Star size={11} /> Nebula Notes
        </button>
        <button className="chip" onClick={() => navigate('comet.star')}>
          <Star size={11} /> Comet Catcher
        </button>
        <button className="chip" onClick={() => navigate('docs.star')}>
          <Star size={11} /> Star guide
        </button>
      </div>
    </div>
  )
}
