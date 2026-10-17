import {
  BookOpen,
  Compass,
  Info,
  Keyboard,
  Leaf,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useBrowser } from '../store/browser'
import { SITES } from '../lib/sites'
import { ShortcutGrid } from '../components/ShortcutGrid'

const SECTIONS = [
  { id: 'start', label: 'Start here' },
  { id: 'apps', label: 'The constellation' },
  { id: 'memory', label: 'Tabs & memory' },
  { id: 'shortcuts', label: 'Keyboard shortcuts' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'faq', label: 'Small print & FAQ' },
]

export function DocsPage() {
  const { navigate } = useBrowser()

  const jump = (id: string) => {
    document.getElementById(`docs-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="docs-page">
      <nav className="docs-nav">
        <div className="docs-nav__title">Stellar Docs</div>
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault()
              jump(s.id)
            }}
          >
            {s.label}
          </a>
        ))}
        <div className="docs-toc-note">
          Version 1.0 · updated today
          <br />
          Written for you, not for a legal department.
        </div>
      </nav>

      <article className="docs-body">
        <div className="page__head" style={{ marginBottom: 26 }}>
          <div>
            <div className="page__eyebrow">
              <BookOpen size={11} /> The manual
            </div>
            <h1 className="page__title">A short guide to Star</h1>
            <p className="page__sub">
              Everything Star Browser does, why it does it that way, and which keys make it feel fast.
              Five minutes, no jargon.
            </p>
          </div>
        </div>

        <section id="docs-start">
          <h2>Start here</h2>
          <p className="lead">
            Star Browser is a calmer place to start your day. It opens to a page that asks where you
            want to go, keeps a small constellation of useful apps built in, and puts tabs to sleep
            before they can grow into a memory problem.
          </p>
          <p>
            The address bar is the one place where everything clicks together: type a site name, a
            star app, a half-remembered bookmark, or a question. Star suggests pages from your own
            history and bookmarks first — no request leaves your machine for those.
          </p>
          <div className="callout">
            <Info size={15} />
            <span>
              <strong>What Star honestly is.</strong> Star is a real browser workspace running in a
              normal browser tab. The built-in apps — notes, mail, radio, the game, the sky guide —
              are fully real. For the wider web, Star hands the address to your system browser
              through the portal instead of pretending to be Chrome. That keeps it light, and keeps
              other sites from breaking inside a shell.
            </span>
          </div>
          <h3>The three things worth knowing</h3>
          <ul>
            <li>
              <strong>The constellation</strong> is the six built-in apps on the new tab page. All
              local, all tiny.
            </li>
            <li>
              <strong>Hibernation</strong> is what keeps memory polite. Idle tabs go to sleep; a click
              wakes them instantly.
            </li>
            <li>
              <strong>The command palette</strong> (<kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd>) reaches
              everything: apps, pages, settings, tabs, themes.
            </li>
          </ul>
        </section>

        <section id="docs-apps">
          <h2>The constellation</h2>
          <p>
            Six apps live inside Star. They open in tabs like any page, but they never leave your
            device.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '16px 0 18px' }}>
            {SITES.map((site) => {
              const Icon = site.icon
              return (
                <button
                  key={site.id}
                  className="result"
                  style={{ padding: '12px 14px' }}
                  onClick={() => navigate(site.url)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        display: 'grid',
                        placeItems: 'center',
                        background: `linear-gradient(145deg, ${site.accent[0]}, ${site.accent[1]})`,
                        color: '#12101c',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={13} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 560 }}>{site.title}</span>
                      <span style={{ display: 'block', fontSize: 10, color: 'var(--faint)' }}>
                        {site.subtitle}
                      </span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          <p>
            Notes and mail persist in local storage. The radio is synthesised live — nothing is
            streamed. The comet game is a canvas arcade in about 200 lines. The sky guide computes
            the Moon's phase from your own clock.
          </p>
        </section>

        <section id="docs-memory">
          <h2>Tabs &amp; memory</h2>
          <p>
            Most browsers keep every background tab fully alive. Leave twenty open and the fan starts
            asking questions. Star takes a different approach: a tab is only <em>awake</em> while you
            are using it.
          </p>
          <h3>What hibernation does</h3>
          <ul>
            <li>
              After ten idle minutes (configurable in Settings → Memory), a background tab is marked
              asleep. Its title, favicon and place in the tab strip stay put.
            </li>
            <li>
              The moment you click a sleeping tab, it wakes with its address, history and state
              intact. Nothing is lost.
            </li>
            <li>
              The active tab is never hibernated, and you can pin a tab awake simply by leaving it in
              front.
            </li>
            <li>
              The <Leaf size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> button in
              the toolbar hibernates every idle tab at once.
            </li>
          </ul>
          <div className="callout callout--neutral">
            <Leaf size={15} />
            <span>
              <strong>About those megabyte numbers.</strong> Star is a web app, so the browser doesn't
              let it read true process memory. The figures you see are a deliberately conservative
              model of what each page would cost — consistent enough to show the savings from
              hibernation. The habit is the real feature: fewer live tabs, less churn, a calmer
              machine.
            </span>
          </div>
          <h3>Keeping it light</h3>
          <p>
            Star ships without a sync daemon, a background updater or an extension stack. The whole
            app is a single small page. The drifting aurora is CSS, the stars are SVG, and the
            "reduce motion" switch in Settings turns all of it down.
          </p>
        </section>

        <section id="docs-shortcuts">
          <h2>Keyboard shortcuts</h2>
          <p>
            Single-key shortcuts work whenever you are not typing in a field. They are designed to be
            memorable, not cryptic.
          </p>
          <ShortcutGrid />
          <p style={{ marginTop: 14 }}>
            The big search field on the new tab page also has its own small engine picker. Choose
            Star for local results, or one of the web engines to hand the query to your system
            browser.
          </p>
        </section>

        <section id="docs-privacy">
          <h2>Privacy</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="about-list">
              <li>
                <ShieldCheck size={13} />
                <span>No accounts, no sync, no analytics, no error reporting. There is nowhere for
                your data to go.</span>
              </li>
              <li>
                <ShieldCheck size={13} />
                <span>Bookmarks, history, settings, notes and mail live in this browser's local
                storage. Clearing site data removes them for good.</span>
              </li>
              <li>
                <ShieldCheck size={13} />
                <span>Star Search uses a local index of the constellation and your own saved pages.
                It never sends your query anywhere.</span>
              </li>
              <li>
                <ShieldCheck size={13} />
                <span>If you pick Google, DuckDuckGo or Bing as your engine, Star opens that search
                in your system browser through the portal. After that, their privacy policy applies —
                not this one.</span>
              </li>
            </div>
            <div className="callout callout--neutral">
              <Compass size={15} />
              <span>
                You can export everything as JSON, or erase it all, from{' '}
                <button
                  style={{ color: 'var(--gold)', fontWeight: 550 }}
                  onClick={() => navigate('star://settings#privacy')}
                >
                  Settings → Privacy &amp; data
                </button>
                .
              </span>
            </div>
          </div>
        </section>

        <section id="docs-faq">
          <h2>Small print &amp; FAQ</h2>
          <h3>Is Star a replacement for Chrome?</h3>
          <p>
            It is a replacement for the <em>feeling</em> of Chrome: a calmer start page, fewer
            background processes, useful things built in. Under the hood it uses your browser's
            engine, so external pages open in your browser.
          </p>
          <h3>Does it really save RAM?</h3>
          <p>
            Star itself is small, and its hibernation logic is real. The megabyte readouts are
            modelled rather than measured — see the note above. If you want the feeling of a lighter
            browser, closing unused tabs is still the biggest win, and Star makes that pleasant.
          </p>
          <h3>Where do my notes and mail go?</h3>
          <p>
            Nebula Notes and Orbit Mail store everything in local storage on this device. Mail is a
            demo: messages stay in the app and are never sent.
          </p>
          <h3>Is the focus radio streaming?</h3>
          <p>
            No. It is generated live with the Web Audio API — oscillators, filtered noise and a
            little reverb. Three stations, no downloads, no buffers.
          </p>
          <h3>Can I get my data out?</h3>
          <p>
            Yes. Settings → Privacy &amp; data → Export everything gives you a single JSON file with
            everything Star knows.
          </p>
          <div className="callout">
            <Sparkles size={15} />
            <span>
              That's the whole manual. Go take a look around — the sky is quiet.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="btn btn--sm btn--primary" onClick={() => navigate('star://newtab')}>
              Back to the sky
            </button>
            <button className="btn btn--sm" onClick={() => navigate('sky.star')}>
              Open Night Sky
            </button>
            <button className="btn btn--sm" onClick={() => navigate('star://about#shortcuts')}>
              <Keyboard size={12} /> Shortcut sheet
            </button>
          </div>
        </section>
      </article>
    </div>
  )
}
