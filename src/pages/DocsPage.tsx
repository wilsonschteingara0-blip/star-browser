import {
  BookOpen,
  Compass,
  Info,
  Keyboard,
  Leaf,
  ShieldCheck,
  Sparkles,
  Cpu,
} from 'lucide-react'
import { useBrowser } from '../store/browser'
import { SITES } from '../lib/sites'
import { ShortcutGrid } from '../components/ShortcutGrid'
import { CHROMIUM_GITHUB, ELECTRON_GITHUB, isDesktop } from '../lib/desktop'

const SECTIONS = [
  { id: 'start', label: 'Start here' },
  { id: 'apps', label: 'The constellation' },
  { id: 'memory', label: 'Tabs & memory' },
  { id: 'engine', label: 'Chromium engine' },
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
          Version 1.1 · updated today
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
              <strong>What Star honestly is.</strong> Star ships in two shapes. The web preview is a
              workspace running in a normal browser tab; it hands external addresses to your system
              browser. The desktop edition is a real Chromium browser: external tabs are sandboxed
              Chromium guests inside Star, and hibernation destroys their renderer processes. The
              built-in apps — notes, mail, radio, the game, the sky guide — are real in both.
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
              The moment you click a sleeping tab, it wakes at the same address with the same session
              and cookies. In the desktop app the page reloads on a fresh Chromium renderer — that
              reload is exactly where the RAM comes back.
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
              <strong>About those megabyte numbers.</strong>{' '}
              {isDesktop()
                ? "Web tabs are measured from Chromium's own renderer processes, so the panel shows the real cost of a page and the real saving when it sleeps. Star's shell baseline is still a conservative model."
                : "The web preview cannot read process memory, so the figures are a deliberately conservative model. In the desktop app, Chromium's real counters replace the model — and hibernation destroys the renderer for real."}
            </span>
          </div>
          <h3>Keeping it light</h3>
          <p>
            Star ships without a sync daemon, a background updater or an extension stack. The whole
            app is a single small page. The drifting aurora is CSS, the stars are SVG, and the
            "reduce motion" switch in Settings turns all of it down.
          </p>
        </section>

        <section id="docs-engine">
          <h2>Under the hood: Chromium</h2>
          <p className="lead">
            The desktop edition of Star is a Chromium browser. The same open-source engine Chrome is
            built on renders every external tab; Star supplies only the quiet chrome around it.
          </p>
          <p>
            Chromium is wired in through Electron, which packages the engine and its multi-process
            renderer without bundling Google's services. The source of both is public:{' '}
            <a className="inline-link" href={CHROMIUM_GITHUB} target="_blank" rel="noreferrer">
              chromium/chromium
            </a>{' '}
            and{' '}
            <a className="inline-link" href={ELECTRON_GITHUB} target="_blank" rel="noreferrer">
              electron/electron
            </a>
            .
          </p>

          <h3>How an external tab works</h3>
          <ul>
            <li>
              Every awake web tab is a <strong>sandboxed Chromium guest</strong> in its own renderer
              process. It shares one persistent session, so logins and cookies follow you between
              tabs and restarts.
            </li>
            <li>
              Hibernating or closing a tab <strong>destroys the guest</strong>. There is no hidden
              window left running: the memory panel's number is measured from the process before it
              goes.
            </li>
            <li>
              The address bar, arrows and reload button drive Chromium's <strong>real session
              history</strong>, not a copy of it. Links that demand a new window become new Star tabs.
            </li>
            <li>
              Guests get no Node, no preload and no bridge. Star only grants fullscreen and clipboard
              writes; camera, microphone, location and notifications are denied by default.
            </li>
            <li>
              Downloads use the normal save dialog. Restored background tabs start asleep, so a
              twenty-tab session does not boot twenty renderers.
            </li>
          </ul>

          <div className="callout">
            <Cpu size={15} />
            <span>
              <strong>Run it.</strong> Install once with <code>npm install</code>, then{' '}
              <code>npm run desktop</code> to build and open the Chromium window. While developing,{' '}
              <code>npm run desktop:dev</code> starts Vite and the shell together. The web preview
              keeps working with no Electron at all. There is a full overview at{' '}
              <button className="inline-link" onClick={() => navigate('star://chromium')}>
                star://chromium
              </button>
              .
            </span>
          </div>
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
                <span>If you pick Google, DuckDuckGo or Bing as your engine, the search page opens
                in a Chromium tab {isDesktop() ? 'inside Star' : 'through the portal'}. After that,
                that site's privacy policy applies — not this one. Star never ships your keystrokes
                to a search engine on its own.</span>
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
            The desktop edition is a Chromium browser with a calmer face: the engine is the same, the
            services, sync and extension surface are not. The web preview is a lighter workspace that
            hands external pages to your default browser. They share an interface and a local-first
            model, not data: each installation keeps its own tabs, notes and history.
          </p>
          <h3>Does it really save RAM?</h3>
          <p>
            In the desktop app, yes — and you can watch it happen. A hibernated web tab has no
            Chromium renderer left alive; the panel's figures are read from the process before it is
            destroyed. The web preview can only model those numbers, but the habit — fewer live tabs,
            less churn — is identical.
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
