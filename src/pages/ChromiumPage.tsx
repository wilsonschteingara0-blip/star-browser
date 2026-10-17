import { useState } from 'react'
import {
  ArrowUpRight,
  Boxes,
  Check,
  Copy,
  Cpu,
  ExternalLink,
  Code2,
  Layers,
  Leaf,
  Lock,
  Monitor,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import { useBrowser } from '../store/browser'
import {
  CHROMIUM_GITHUB,
  ELECTRON_GITHUB,
  chromiumVersion,
  electronVersion,
  engineLabel,
  isDesktop,
  openExternalUrl,
} from '../lib/desktop'
import { StarMark } from '../components/StarMark'

const RUN_COMMAND = 'npm install && npm run desktop'

export function ChromiumPage() {
  const { navigate, toast, state } = useBrowser()
  const [copied, setCopied] = useState(false)
  const native = isDesktop()
  const chromeVersion = chromiumVersion()

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(RUN_COMMAND)
      setCopied(true)
      toast('Command copied — run it in the project folder', { icon: 'check' })
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      toast('Select the command above and copy it manually', { icon: 'info' })
    }
  }

  return (
    <div className="page chromium-page">
      <div className="chromium-hero">
        <div className="chromium-hero__copy">
          <div className="page__eyebrow">
            <Cpu size={11} /> Under the hood
          </div>
          <h1 className="chromium-hero__title">
            Chromium is the <em>engine</em>.
          </h1>
          <p className="chromium-hero__lede">
            The same open-source project Chrome is built on renders every external page in Star's
            desktop edition. Star supplies the quiet chrome, the tabs that sleep and the constellation
            of local apps. Google's services, sync and extension stack are not invited.
          </p>
          <div className="chromium-hero__actions">
            <button
              className="btn btn--sm"
              onClick={() => openExternalUrl(CHROMIUM_GITHUB)}
            >
              <Code2 size={12} /> chromium/chromium <ArrowUpRight size={11} />
            </button>
            <button className="btn btn--sm" onClick={() => openExternalUrl(ELECTRON_GITHUB)}>
              <Code2 size={12} /> electron/electron <ArrowUpRight size={11} />
            </button>
          </div>
        </div>

        <div className="chromium-hero__ring" aria-hidden="true">
          <span className="chromium-hero__orb" />
          <span className="chromium-hero__version">
            <small>{native ? 'running now' : 'desktop edition'}</small>
            <strong>{native ? engineLabel() : 'Chromium'}</strong>
            <span>{native && electronVersion() ? `Electron ${electronVersion()}` : 'Blink · V8 · Skia'}</span>
          </span>
        </div>
      </div>

      <div className="chromium-status" data-native={native}>
        <span className="chromium-status__dot" />
        <div>
          <strong>
            {native
              ? `${engineLabel()} is rendering this window`
              : 'You are in the web preview — Chromium is one command away'}
          </strong>
          <span>
            {native
              ? `Chromium ${chromeVersion || '—'} · Electron ${electronVersion()} · ${state.tabs.filter((t) => t.kind === 'external' && !t.sleeping).length} live guest${state.tabs.filter((t) => t.kind === 'external' && !t.sleeping).length === 1 ? '' : 's'}`
              : 'The preview runs in your current browser. The desktop edition embeds Chromium and sandboxes every tab.'}
          </span>
        </div>
        {!native && (
          <button className="btn btn--sm btn--primary" onClick={() => navigate('docs.star')}>
            Read the launch guide
          </button>
        )}
      </div>

      <div className="chromium-facts">
        <div className="chromium-fact">
          <span className="chromium-fact__icon"><Zap size={14} /></span>
          <div>
            <span className="chromium-fact__label">Rendering</span>
            <strong>Blink + Skia</strong>
            <small>Chromium's layout and paint pipeline</small>
          </div>
        </div>
        <div className="chromium-fact">
          <span className="chromium-fact__icon"><Boxes size={14} /></span>
          <div>
            <span className="chromium-fact__label">JavaScript</span>
            <strong>V8</strong>
            <small>The engine inside the engine</small>
          </div>
        </div>
        <div className="chromium-fact">
          <span className="chromium-fact__icon"><Monitor size={14} /></span>
          <div>
            <span className="chromium-fact__label">Runtime</span>
            <strong>{native ? `Electron ${electronVersion()}` : 'Electron 44'}</strong>
            <small>Chromium with a window and an IPC bridge</small>
          </div>
        </div>
        <div className="chromium-fact">
          <span className="chromium-fact__icon"><ShieldCheck size={14} /></span>
          <div>
            <span className="chromium-fact__label">Licence</span>
            <strong>BSD-3-Clause</strong>
            <small>Open source, like the web should be</small>
          </div>
        </div>
      </div>

      <section className="chromium-section">
        <div className="chromium-section__head">
          <span className="chromium-section__icon"><Layers size={14} /></span>
          <div>
            <h3>How a Star tab is assembled</h3>
            <p>One awake page, one renderer, one set of rules — every time.</p>
          </div>
        </div>
        <div className="chromium-steps">
          <div className="chromium-step">
            <span className="chromium-step__num">01</span>
            <div>
              <strong>The Star chrome</strong>
              <span>
                Tabs, omnibox and built-in apps are React in a sandboxed host renderer. No Node, no
                remote content.
              </span>
            </div>
          </div>
          <div className="chromium-step">
            <span className="chromium-step__num">02</span>
            <div>
              <strong>The Chromium guest</strong>
              <span>
                Each awake web tab is a <code>&lt;webview&gt;</code> on its own renderer process.
                Context isolation on, Node off, no preload, deny-by-default permissions.
              </span>
            </div>
          </div>
          <div className="chromium-step">
            <span className="chromium-step__num">03</span>
            <div>
              <strong>The real session</strong>
              <span>
                Back, forward and reload drive Chromium's own history. Cookies and logins live in a
                persistent partition on this machine.
              </span>
            </div>
          </div>
          <div className="chromium-step">
            <span className="chromium-step__num">04</span>
            <div>
              <strong>The sleep</strong>
              <span>
                Hibernating or closing a tab destroys the guest. The memory panel reads the process
                before it goes; the habit is the feature, made literal.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="chromium-section">
        <div className="chromium-section__head">
          <span className="chromium-section__icon"><Leaf size={14} /></span>
          <div>
            <h3>Ram, watched</h3>
            <p>What actually happens when a tab drifts off.</p>
          </div>
        </div>
        <div className="chromium-ram">
          <div>
            <span className="chromium-ram__value">
              {Math.round(state.stats.ramSavedMB)}
              <small>MB</small>
            </span>
            <span className="chromium-ram__label">released by hibernation so far</span>
          </div>
          <div>
            <span className="chromium-ram__value">
              {state.stats.hibernated}
              <small>tabs</small>
            </span>
            <span className="chromium-ram__label">put to sleep on this device</span>
          </div>
          <div>
            <span className="chromium-ram__value">
              {state.tabs.filter((t) => !t.sleeping && t.kind === 'external').length}
              <small>live</small>
            </span>
            <span className="chromium-ram__label">Chromium guests awake right now</span>
          </div>
        </div>
        <div className="engine-note" style={{ paddingLeft: 2 }}>
          <ShieldCheck size={11} />
          <span>
            {native
              ? "Web-tab figures come from Chromium's process counters. Shared same-site processes can repeat a number; Star's own shell baseline is modelled."
              : 'The preview cannot read process memory, so its figures are a conservative model. In the desktop app they are measured from the real renderer.'}
          </span>
        </div>
      </section>

      <section className="chromium-section chromium-section--run">
        <div className="chromium-section__head">
          <span className="chromium-section__icon"><Terminal size={14} /></span>
          <div>
            <h3>{native ? 'You are already running it' : 'Bring Chromium to your machine'}</h3>
            <p>
              {native
                ? 'This window is the Chromium edition. Everything below is how it got here.'
                : 'One install, one launch. The web preview stays available for a quick look.'}
            </p>
          </div>
        </div>
        <div className="chromium-run">
          <code>{RUN_COMMAND}</code>
          <button className="btn btn--sm" onClick={copyCommand}>
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="chromium-run__meta">
          <span><Lock size={10} /> downloads the Chromium runtime once</span>
          <span><Sparkles size={10} /> ~120 MB · no account</span>
          <button className="inline-link" onClick={() => navigate('docs.star')}>
            full guide
          </button>
          <button className="inline-link" onClick={() => navigate('star://settings#engine')}>
            engine settings
          </button>
        </div>
      </section>

      <div className="chromium-credits">
        <StarMark size={14} gradient />
        <span>
          Star Browser 1.1 · built on the shoulders of{' '}
          <button className="inline-link" onClick={() => openExternalUrl(CHROMIUM_GITHUB)}>
            chromium/chromium
          </button>{' '}
          and{' '}
          <button className="inline-link" onClick={() => openExternalUrl(ELECTRON_GITHUB)}>
            electron/electron
          </button>
          . Not affiliated with Google.
        </span>
        <button className="btn btn--sm btn--ghost" onClick={() => navigate('star://about')}>
          About Star <ExternalLink size={11} />
        </button>
      </div>
    </div>
  )
}
