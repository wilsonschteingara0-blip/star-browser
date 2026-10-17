import {
  ArrowUpRight,
  Cpu,
  Download,
  Feather,
  Heart,
  Leaf,
  ShieldCheck,
  Sparkles,
  Trash2,
  Keyboard,
} from 'lucide-react'
import { useBrowser } from '../store/browser'
import { StarMark } from '../components/StarMark'
import { ShortcutGrid } from '../components/ShortcutGrid'
import { exportBrowserData, eraseEverything } from '../lib/data'
import {
  CHROMIUM_GITHUB,
  ELECTRON_GITHUB,
  chromiumVersion,
  electronVersion,
  engineDetail,
  engineLabel,
  isDesktop,
  openExternalUrl,
} from '../lib/desktop'

export function AboutPage() {
  const { state, navigate, toast } = useBrowser()

  return (
    <div className="page">
      <div className="about-hero">
        <div className="about-mark">
          <StarMark size={42} />
        </div>
        <h1>
          A browser that <em>whispers</em>.
        </h1>
        <div className="about-version">
          <Sparkles size={10} /> version 1.1.0 · the constellation edition
          {isDesktop() ? ' · chromium' : ''}
        </div>
        <p className="about-tagline">
          Star is a small, local-first browser workspace built around one idea: the best browser is
          the one you notice least. It keeps useful things a click away and lets idle tabs rest.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--primary" onClick={() => navigate('star://newtab')}>
            Start browsing
          </button>
          <button className="btn" onClick={() => navigate('docs.star')}>
            Read the manual
          </button>
        </div>
      </div>

      <div className="principles">
        <div className="principle">
          <span className="principle__icon">
            <Leaf size={15} />
          </span>
          <h3>Light by default</h3>
          <p>
            No background daemons, no sync client, no extension stack. Tabs hibernate before they
            become a problem.
          </p>
        </div>
        <div className="principle">
          <span className="principle__icon">
            <ShieldCheck size={15} />
          </span>
          <h3>Local by default</h3>
          <p>
            Bookmarks, history, notes and mail live on this device. No account, no telemetry, no
            cloud to opt out of.
          </p>
        </div>
        <div className="principle">
          <span className="principle__icon">
            <Sparkles size={15} />
          </span>
          <h3>A little extra</h3>
          <p>
            A constellation of built-in apps, three themes, a command palette, and a sky guide that
            knows tonight's moon.
          </p>
        </div>
      </div>

      <div className="about-block" id="engine">
        <div className="about-block__head">
          <div>
            <h3>
              <Cpu size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
              Engine
            </h3>
            <p>
              {isDesktop()
                ? `${engineDetail()} is rendering this window.`
                : 'You are looking at the web preview. The desktop app does the real work with Chromium.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button className="btn btn--sm" onClick={() => navigate('star://chromium')}>
              Open the engine page <ArrowUpRight size={12} />
            </button>
            <button className="btn btn--sm" onClick={() => openExternalUrl(CHROMIUM_GITHUB)}>
              Chromium on GitHub <ArrowUpRight size={12} />
            </button>
            <button className="btn btn--sm" onClick={() => openExternalUrl(ELECTRON_GITHUB)}>
              Electron <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
        <div className="about-block__body">
          <div className="engine-panel">
            <span className="engine-panel__mark">
              <Cpu size={17} />
            </span>
            <div className="engine-panel__text">
              <div className="engine-panel__name">{engineLabel()}</div>
              <div className="engine-panel__sub">
                The same open-source engine Chrome is built on, without Google's services bundled in.
                Star adds its own quiet chrome on top.
              </div>
            </div>
            <div className="engine-facts">
              <div className="engine-fact">
                <span className="engine-fact__label">Engine</span>
                <span className="engine-fact__value">
                  {isDesktop() ? `Chromium ${chromiumVersion().split('.')[0]}` : 'Web preview'}
                </span>
              </div>
              <div className="engine-fact">
                <span className="engine-fact__label">App shell</span>
                <span className="engine-fact__value">
                  {isDesktop() ? `Electron ${electronVersion()}` : 'Your browser'}
                </span>
              </div>
              <div className="engine-fact">
                <span className="engine-fact__label">Web pages</span>
                <span className="engine-fact__value">
                  {isDesktop() ? 'Sandboxed guests' : 'System hand-off'}
                </span>
              </div>
            </div>
          </div>
          <ul className="about-list" style={{ marginTop: 12 }}>
            <li>
              <ShieldCheck size={13} />
              <span>
                {isDesktop()
                  ? 'Every external tab is a sandboxed Chromium renderer in its own process, with no Node access and no preload.'
                  : 'Run `npm run desktop` to launch Star on Chromium. The web preview stays fully usable and hands external pages to your browser.'}
              </span>
            </li>
            <li>
              <Leaf size={13} />
              <span>
                Hibernating a tab destroys its Chromium renderer instead of merely hiding it — the
                memory number in the panel is read from the process, not guessed.
              </span>
            </li>
            <li>
              <Cpu size={13} />
              <span>
                Chromium is open source under BSD-3-Clause. Star pins the engine through{' '}
                <button className="inline-link" onClick={() => openExternalUrl('https://github.com/chromium/chromium')}>
                  chromium/chromium
                </button>{' '}
                and{' '}
                <button className="inline-link" onClick={() => openExternalUrl('https://github.com/electron/electron')}>
                  electron/electron
                </button>
                .
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="about-block" id="shortcuts">
        <div className="about-block__head">
          <div>
            <h3>
              <Keyboard size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
              Keyboard shortcuts
            </h3>
            <p>Single keys work when you're not typing.</p>
          </div>
          <button className="btn btn--sm" onClick={() => navigate('docs.star')}>
            Full guide <ArrowUpRight size={12} />
          </button>
        </div>
        <div style={{ padding: 12 }}>
          <ShortcutGrid />
        </div>
      </div>

      <div className="about-block">
        <div className="about-block__head">
          <div>
            <h3>Your data is yours</h3>
            <p>
              Star currently knows about {state.bookmarks.length} bookmarks, {state.history.length}{' '}
              history entries and {state.tabs.length} open tabs.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button
              className="btn btn--sm"
              onClick={() => {
                exportBrowserData(state)
                toast('Your data is on its way', { icon: 'check' })
              }}
            >
              <Download size={12} /> Export JSON
            </button>
            <button
              className="btn btn--sm btn--danger"
              onClick={() => {
                if (window.confirm('Erase all Star Browser data on this device? This cannot be undone.')) {
                  eraseEverything()
                }
              }}
            >
              <Trash2 size={12} /> Erase data
            </button>
          </div>
        </div>
        <div className="about-block__body">
          <ul className="about-list">
            <li>
              <ShieldCheck size={13} />
              <span>
                Local storage only. Nothing is transmitted, and there is no server behind Star.
              </span>
            </li>
            <li>
              <Cpu size={13} />
              <span>
                {isDesktop()
                  ? "Web-tab memory is read from Chromium's own process counters. Star's shell baseline is still a conservative model."
                  : "Memory figures are modelled, not measured — a web preview can't see process memory. In the desktop app, Chromium's real counters replace the model."}
              </span>
            </li>
            <li>
              <Feather size={13} />
              <span>
                Built with React, Vite, a little Web Audio and a lot of CSS. Typography is Inter and
                Instrument Serif.
              </span>
            </li>
            <li>
              <Sparkles size={13} />
              <span>
                {isDesktop()
                  ? 'External pages open in Chromium, inside Star. The web preview keeps the portal hand-off.'
                  : 'This preview hands external pages to your system browser. The Chromium desktop app opens them in tabs instead.'}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="about-footer">
        Made for people who keep too many tabs open.
        <br />
        <Heart size={10} style={{ display: 'inline', verticalAlign: '-1px', color: 'var(--gold)' }} /> Star
        Browser 1.1.0 · no cookies were harmed
      </div>
    </div>
  )
}
