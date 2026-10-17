import { useEffect, useMemo, useState } from 'react'
import { Inbox, Mail, PenLine, Reply, Send, Star, X } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { loadLocal, saveLocal } from '../lib/storage'
import { timeAgo, uid } from '../lib/utils'

interface Message {
  id: string
  from: string
  email: string
  subject: string
  body: string
  date: number
  read: boolean
  starred: boolean
  folder: 'inbox' | 'sent'
  accent: [string, string]
  to?: string
}

const KEY = 'star-browser:mail:v1'
const ACCENT: [string, string] = ['#6ea8ff', '#9b8bff']

function seedMessages(): Message[] {
  const now = Date.now()
  const h = (hours: number) => now - hours * 60 * 60 * 1000
  return [
    {
      id: 'm1',
      from: 'Mira Vale',
      email: 'mira@orbit.star',
      subject: 'A quieter inbox',
      body:
        "I've been using Star for a week now and my inbox has never looked calmer.\n\nTurns out the trick wasn't filters or rules — it was having fewer places to be. The email app is small, the notes app is small, and somehow that makes the whole day feel smaller too.\n\nLet me know when you publish the next version. I'll bring tea.\n\n— Mira",
      date: h(2),
      read: false,
      starred: true,
      folder: 'inbox',
      accent: ['#6ea8ff', '#9b8bff'],
    },
    {
      id: 'm2',
      from: 'Atlas',
      email: 'atlas@deepfield.star',
      subject: "Tonight's moon is a good one",
      body:
        "Look east after sunset. It's a waxing crescent — thin enough to see the earthshine on the dark side, if the air is clear.\n\nNo telescope required. Just a window and five quiet minutes. Take the good binoculars if you have them, but honestly, the moon is generous.\n\n— Atlas",
      date: h(6),
      read: false,
      starred: false,
      folder: 'inbox',
      accent: ['#7dd3fc', '#a78bfa'],
    },
    {
      id: 'm3',
      from: 'The Star Team',
      email: 'hello@star.browser',
      subject: 'Welcome aboard',
      body:
        "Welcome to Star Browser.\n\nHere is the short version of everything you need to know:\n\n1. Tabs go to sleep when idle. Click one and it wakes where you left it.\n2. The star button in the toolbar bookmarks any page.\n3. Press ⌘K (or Ctrl K) for the command palette.\n4. Nothing you do here is uploaded. There is no server to upload it to.\n\nThat's it. Enjoy the quiet.\n\n— The Star Team",
      date: h(20),
      read: true,
      starred: true,
      folder: 'inbox',
      accent: ['#ffd27a', '#ffab6b'],
    },
    {
      id: 'm4',
      from: 'Noor',
      email: 'noor@orbit.star',
      subject: 'That radio station though',
      body:
        "I put Focus Radio on while I was writing this morning and completely lost track of time. In a good way.\n\n'Deep Field' is the one. It's like the room got a little bigger.\n\nAre there going to be more stations? I'd vote for something with a slow pulse and no melody whatsoever.\n\n— N",
      date: h(27),
      read: true,
      starred: false,
      folder: 'inbox',
      accent: ['#b590ff', '#f07bc0'],
    },
    {
      id: 'm5',
      from: 'Juno Park',
      email: 'juno@noon.star',
      subject: 'Re: Saturday plans',
      body:
        "Saturday works. I'll bring the good telescope and the thermos. You bring the biscuits and the unreasonable optimism about the weather.\n\nIf it clouds over we can just listen to the radio and argue about constellations.\n\n— Juno",
      date: h(44),
      read: true,
      starred: false,
      folder: 'inbox',
      accent: ['#ff8a6b', '#f7c06d'],
    },
    {
      id: 'm6',
      from: 'Courier',
      email: 'receipts@comet.star',
      subject: 'Your telescope has shipped',
      body:
        "Order #ST-9014 is on its way.\n\nEstimated arrival: three to five clear nights. Tracking number: ORION-7741.\n\nThank you for choosing the slow route. The sky isn't going anywhere.\n\n— Courier",
      date: h(70),
      read: true,
      starred: false,
      folder: 'inbox',
      accent: ['#5ad6c2', '#6aa7ff'],
    },
  ]
}

function initials(from: string) {
  return from
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function MailApp() {
  const { toast } = useBrowser()
  const [messages, setMessages] = useState<Message[]>(() => loadLocal<Message[]>(KEY, seedMessages()))
  const [folder, setFolder] = useState<'inbox' | 'starred' | 'sent'>('inbox')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState({ to: '', subject: '', body: '' })
  const [listQuery, setListQuery] = useState('')

  useEffect(() => {
    saveLocal(KEY, messages)
  }, [messages])

  const counts = useMemo(
    () => ({
      inbox: messages.filter((m) => m.folder === 'inbox' && !m.read).length,
      starred: messages.filter((m) => m.starred).length,
      sent: messages.filter((m) => m.folder === 'sent').length,
    }),
    [messages],
  )

  const list = useMemo(() => {
    let base = messages
    if (folder === 'inbox') base = messages.filter((m) => m.folder === 'inbox')
    else if (folder === 'sent') base = messages.filter((m) => m.folder === 'sent')
    else base = messages.filter((m) => m.starred)
    const q = listQuery.toLowerCase().trim()
    if (q) {
      base = base.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.from.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q),
      )
    }
    return [...base].sort((a, b) => b.date - a.date)
  }, [messages, folder, listQuery])

  const selected = messages.find((m) => m.id === selectedId) ?? null

  const openMessage = (message: Message) => {
    setSelectedId(message.id)
    setComposing(false)
    if (!message.read) {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, read: true } : m)))
    }
  }

  const toggleStar = (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)))
  }

  const startCompose = (replyTo?: Message) => {
    setComposing(true)
    setSelectedId(null)
    setDraft(
      replyTo
        ? {
            to: `${replyTo.from} <${replyTo.email}>`,
            subject: replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`,
            body: `\n\n---\nOn ${new Date(replyTo.date).toLocaleDateString()}, ${replyTo.from} wrote:\n\n${replyTo.body
              .split('\n\n')
              .map((p) => `> ${p}`)
              .join('\n>\n')}`,
          }
        : { to: '', subject: '', body: '' },
    )
  }

  const send = () => {
    if (!draft.to.trim() && !draft.subject.trim()) {
      toast('Add a recipient or a subject first', { icon: 'info' })
      return
    }
    const message: Message = {
      id: uid('mail'),
      from: 'You',
      email: 'you@star.browser',
      subject: draft.subject.trim() || '(no subject)',
      body: draft.body.trim(),
      date: Date.now(),
      read: true,
      starred: false,
      folder: 'sent',
      accent: ['#9aa6ff', '#c8b6ff'],
      to: draft.to.trim() || 'you',
    }
    setMessages((prev) => [message, ...prev])
    setComposing(false)
    setFolder('sent')
    setSelectedId(message.id)
    setDraft({ to: '', subject: '', body: '' })
    toast('Message sent — locally, where it stays', { icon: 'check' })
  }

  return (
    <div className="app-frame">
      <div className="app-window">
        <aside className="mail-side">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 14px' }}>
            <span
              className="app-window__brand-icon"
              style={{ '--ca': ACCENT[0], '--cb': ACCENT[1] } as React.CSSProperties}
            >
              <Mail size={13} />
            </span>
            <div>
              <div className="app-window__brand-name">Orbit Mail</div>
              <div className="app-window__brand-sub">local demo</div>
            </div>
          </div>

          <button className="btn btn--sm btn--primary" style={{ margin: '0 4px 10px' }} onClick={() => startCompose()}>
            <PenLine size={12} /> Compose
          </button>

          {[
            { id: 'inbox' as const, label: 'Inbox', icon: Inbox, count: counts.inbox },
            { id: 'starred' as const, label: 'Starred', icon: Star, count: counts.starred },
            { id: 'sent' as const, label: 'Sent', icon: Send, count: counts.sent },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className="mail-folder"
                data-active={folder === item.id}
                onClick={() => {
                  setFolder(item.id)
                  setComposing(false)
                  setSelectedId(null)
                }}
              >
                <Icon size={13} /> {item.label}
                {item.count > 0 && <span className="mail-folder__count">{item.count}</span>}
              </button>
            )
          })}

          <div style={{ marginTop: 'auto', padding: '12px 10px 4px', fontSize: 9.5, color: 'var(--faint)', lineHeight: 1.6 }}>
            This inbox is a demo. Nothing is sent or received — every message lives in local storage.
          </div>
        </aside>

        <div className="mail-list">
          <div className="mail-list__head">
            <span className="mail-list__title" style={{ textTransform: 'capitalize' }}>
              {folder}
            </span>
            <span style={{ fontSize: 10, color: 'var(--faint)' }}>
              {list.length} {list.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
          <div className="app-window__search" style={{ margin: '0 12px 8px' }}>
            <Mail size={11} />
            <input
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              placeholder="Search mail…"
            />
            {listQuery && (
              <button onClick={() => setListQuery('')} aria-label="Clear">
                <X size={10} color="var(--faint)" />
              </button>
            )}
          </div>
          <div className="mail-list__scroll">
            {list.length === 0 && (
              <div style={{ padding: 20, fontSize: 11, color: 'var(--faint)', lineHeight: 1.6 }}>
                Nothing here. Star keeps it that way.
              </div>
            )}
            {list.map((message) => (
              <button
                key={message.id}
                className="mail-row"
                data-active={message.id === selectedId}
                data-unread={!message.read}
                onClick={() => openMessage(message)}
              >
                <div className="mail-row__top">
                  <span className="mail-row__from">
                    {folder === 'sent' ? `To: ${message.to ?? 'you'}` : message.from}
                  </span>
                  <span className="mail-row__time">{timeAgo(message.date)}</span>
                </div>
                <span className="mail-row__subject">
                  {message.starred && <Star size={9} fill="var(--gold)" color="var(--gold)" style={{ marginRight: 4 }} />}
                  {message.subject}
                </span>
                <span className="mail-row__preview">{message.body.replace(/\n/g, ' ')}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="app-window__main">
          {composing ? (
            <>
              <div className="mail-toolbar">
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', flex: 1 }}>
                  New message
                </span>
                <button className="btn btn--sm btn--ghost" onClick={() => setComposing(false)}>
                  Discard
                </button>
                <button className="btn btn--sm btn--primary" onClick={send}>
                  <Send size={12} /> Send
                </button>
              </div>
              <div className="mail-compose">
                <div className="compose-field">
                  <label>To</label>
                  <input
                    value={draft.to}
                    onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                    placeholder="someone@somewhere.star"
                  />
                </div>
                <div className="compose-field">
                  <label>Subject</label>
                  <input
                    value={draft.subject}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                    placeholder="A quiet subject line"
                  />
                </div>
                <div className="compose-field" style={{ flex: 1 }}>
                  <label>Message</label>
                  <textarea
                    style={{ flex: 1, minHeight: 180 }}
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    placeholder="Write something worth reading slowly…"
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--faint)' }}>
                  Sending is a demo — your message is filed under Sent on this device.
                </div>
              </div>
            </>
          ) : selected ? (
            <>
              <div className="mail-toolbar">
                <button className="icon-btn tooltip" data-tip="Back to list" onClick={() => setSelectedId(null)}>
                  <Inbox size={14} />
                </button>
                <button className="icon-btn tooltip" data-tip="Reply" onClick={() => startCompose(selected)}>
                  <Reply size={14} />
                </button>
                <button
                  className="icon-btn tooltip"
                  data-tip={selected.starred ? 'Unstar' : 'Star'}
                  data-active={selected.starred}
                  onClick={() => toggleStar(selected.id)}
                >
                  <Star size={14} fill={selected.starred ? 'currentColor' : 'none'} />
                </button>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--faint)' }}>
                  {selected.folder === 'sent' ? 'Sent' : 'Inbox'} · local
                </span>
              </div>
              <div className="mail-reader">
                <div className="mail-reader__head">
                  <h2 className="mail-reader__subject">{selected.subject}</h2>
                  <div className="mail-reader__meta">
                    <span
                      className="mail-avatar"
                      style={{ '--ca': selected.accent[0], '--cb': selected.accent[1] } as React.CSSProperties}
                    >
                      {initials(selected.from)}
                    </span>
                    <span className="mail-reader__meta-text">
                      <strong>{selected.from}</strong>
                      {selected.email} · to you · {new Date(selected.date).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="mail-reader__body">
                  {selected.body.split('\n\n').map((paragraph, i) =>
                    paragraph === '---' ? (
                      <hr key={i} style={{ border: 0, borderTop: '1px solid var(--line)', margin: '18px 0' }} />
                    ) : (
                      <p key={i} style={paragraph.startsWith('>') ? { color: 'var(--faint)' } : undefined}>
                        {paragraph}
                      </p>
                    ),
                  )}
                  <p className="signature">— sent from a quieter place</p>
                </div>
              </div>
            </>
          ) : (
            <div className="mail-empty-pane">
              <div>
                <Mail size={24} />
                <span>Pick a message, or compose something new.</span>
                <span style={{ fontSize: 10, color: 'var(--faint)' }}>
                  {counts.inbox} unread in your inbox
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
