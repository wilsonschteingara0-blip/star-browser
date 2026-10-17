import { ArrowLeft, ArrowUpRight, Copy, Globe, Lock, ShieldCheck, Star } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { externalUrlOf } from '../lib/url'
import { isDesktop, openExternalUrl } from '../lib/desktop'

export function ExternalPortal({ url }: { url: string }) {
  const { navigate, toggleBookmark, isBookmarked, toast } = useBrowser()
  const target = externalUrlOf(url) || url
  let host = target
  let path = ''
  try {
    const parsed = new URL(target)
    host = parsed.hostname.replace(/^www\./, '')
    path = parsed.pathname + parsed.search + parsed.hash
  } catch {
    /* leave as-is */
  }

  const bookmarked = isBookmarked(target)
  const native = isDesktop()

  const openExternal = () => {
    openExternalUrl(target)
    toast('Handed off to your system browser', { icon: 'info' })
  }

  return (
    <div className="portal">
      <div className="portal__card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="portal__icon">
            <Globe size={24} strokeWidth={1.8} />
          </span>
          <span className="chip" style={{ height: 24, fontSize: 10 }}>
            <Lock size={10} /> {native ? 'chromium hand-off' : 'open web'}
          </span>
        </div>

        <div>
          <div className="portal__eyebrow">You're at the edge of the constellation</div>
          <h1 className="portal__host">{host}</h1>
          <p className="portal__note" style={{ marginTop: 8 }}>
            {native
              ? "This page should be running on Chromium inside Star. The guest didn't attach, so here's a clean hand-off instead."
              : 'Star\'s web preview cannot embed other sites, so it hands them to your system browser. The desktop app loads them with Chromium instead — no hand-off, no second window.'}
          </p>
        </div>

        <div className="portal__url">{target}</div>

        <div className="portal__actions">
          <button className="btn btn--primary" onClick={openExternal}>
            <ArrowUpRight size={14} /> Open in your browser
          </button>
          <button
            className="btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(target)
                toast('Link copied to clipboard', { icon: 'check' })
              } catch {
                toast('Clipboard is blocked here — select the address to copy it', { icon: 'info' })
              }
            }}
          >
            <Copy size={13} /> Copy link
          </button>
          <button className="btn" onClick={() => toggleBookmark(target, host)}>
            <Star size={13} fill={bookmarked ? 'currentColor' : 'none'} />
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button className="btn btn--ghost" onClick={() => navigate('star://newtab')}>
            <ArrowLeft size={13} /> Back to the constellation
          </button>
        </div>

        <div className="portal__note">
          <ShieldCheck size={13} />
          <span>
            {native
              ? 'In the desktop app every external tab is a sandboxed Chromium renderer. Hibernating or closing it destroys that process, which is where the memory goes back.'
              : 'Why a portal? The web preview is not allowed to embed most of the modern web, and an iframe would only break pages. The Chromium desktop app is the real thing.'}
          </span>
        </div>

        {!native && (
          <button className="portal__engine-link" onClick={() => navigate('star://chromium')}>
            How Star runs Chromium on the desktop <ArrowUpRight size={11} />
          </button>
        )}
      </div>
    </div>
  )
}
