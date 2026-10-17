import { useEffect, useMemo, useRef, useState } from 'react'
import { Feather, Plus, Search, Trash2, X } from 'lucide-react'
import { useBrowser } from '../store/browser'
import { loadLocal, saveLocal } from '../lib/storage'
import { timeAgo, uid } from '../lib/utils'

interface Note {
  id: string
  title: string
  body: string
  createdAt: number
  updatedAt: number
}

const KEY = 'star-browser:notes:v1'
const ACCENT: [string, string] = ['#ff8a6b', '#f7c06d']

function seedNotes(): Note[] {
  const now = Date.now()
  return [
    {
      id: 'note-welcome',
      title: 'Welcome to Nebula Notes',
      body:
        "This is a quiet corner of Star Browser. Anything you write here stays on this device, in local storage — no account, no sync, no cloud.\n\nA few things to try:\n\n• Rename this note in the title field above.\n• Hit the plus button to start something new.\n• Everything saves itself as you type. Close the tab and come back; it will be waiting.\n\nNebula is deliberately simple. It is a place to think, not a place to organise your whole life.",
      createdAt: now - 1000 * 60 * 60 * 26,
      updatedAt: now - 1000 * 60 * 60 * 26,
    },
    {
      id: 'note-reading',
      title: 'Things worth reading slowly',
      body:
        "• The Carl Sagan passage about the pale blue dot.\n• That long essay on why browsers got heavy.\n• The instruction manual for the telescope I keep borrowing.\n• Ursula K. Le Guin on carriers of the imagination.\n\nAdd your own. This list is allowed to grow.",
      createdAt: now - 1000 * 60 * 60 * 50,
      updatedAt: now - 1000 * 60 * 60 * 5,
    },
    {
      id: 'note-wins',
      title: 'Small wins',
      body:
        "Closed 14 tabs before lunch.\nLearned the name of the bright star above the roofline (it was Jupiter, probably).\nMade tea instead of opening another news site.",
      createdAt: now - 1000 * 60 * 60 * 70,
      updatedAt: now - 1000 * 60 * 60 * 72,
    },
  ]
}

function words(body: string) {
  const trimmed = body.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

export function NotesApp() {
  const { toast } = useBrowser()
  const [notes, setNotes] = useState<Note[]>(() => loadLocal<Note[]>(KEY, seedNotes()))
  const [selectedId, setSelectedId] = useState<string>('')
  const [query, setQuery] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!selectedId && notes.length > 0) setSelectedId(notes[0].id)
  }, [notes, selectedId])

  useEffect(() => {
    saveLocal(KEY, notes)
  }, [notes])

  const selected = notes.find((n) => n.id === selectedId)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const list = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
    if (!q) return list
    return list.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
  }, [notes, query])

  const update = (patch: Partial<Note>) => {
    if (!selected) return
    setNotes((prev) =>
      prev.map((n) => (n.id === selected.id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    )
  }

  const create = () => {
    const now = Date.now()
    const note: Note = {
      id: uid('note'),
      title: '',
      body: '',
      createdAt: now,
      updatedAt: now,
    }
    setNotes((prev) => [note, ...prev])
    setSelectedId(note.id)
    setQuery('')
    window.setTimeout(() => titleRef.current?.focus(), 30)
  }

  const remove = () => {
    if (!selected) return
    const remaining = notes.filter((n) => n.id !== selected.id)
    setNotes(remaining)
    setSelectedId(remaining[0]?.id ?? '')
    toast('Note deleted', { icon: 'check' })
  }

  return (
    <div className="app-frame">
      <div className="app-window">
        <aside className="app-window__side">
          <div className="app-window__head">
            <div className="app-window__brand">
              <span
                className="app-window__brand-icon"
                style={{ '--ca': ACCENT[0], '--cb': ACCENT[1] } as React.CSSProperties}
              >
                <Feather size={13} strokeWidth={2.2} />
              </span>
              <div>
                <div className="app-window__brand-name">Nebula Notes</div>
                <div className="app-window__brand-sub">{notes.length} notes · on this device</div>
              </div>
            </div>
            <button className="icon-btn" onClick={create} title="New note" aria-label="New note" style={{ width: 28, height: 28 }}>
              <Plus size={15} />
            </button>
          </div>

          <div className="app-window__search">
            <Search size={12} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a note…" />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search">
                <X size={11} color="var(--faint)" />
              </button>
            )}
          </div>

          <div className="notes-list">
            {filtered.length === 0 && (
              <div style={{ padding: 18, fontSize: 11, color: 'var(--faint)', lineHeight: 1.6 }}>
                {query ? 'No notes match that search.' : 'No notes yet. Write the first one.'}
              </div>
            )}
            {filtered.map((note) => (
              <button
                key={note.id}
                className="note-item"
                data-active={note.id === selectedId}
                onClick={() => setSelectedId(note.id)}
              >
                <span className="note-item__title">{note.title.trim() || 'Untitled note'}</span>
                <span className="note-item__preview">{note.body.trim() || 'Empty — a blank page'}</span>
                <span className="note-item__date">{timeAgo(note.updatedAt)}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="app-window__main">
          <div className="notes-toolbar">
            <span className="notes-toolbar__title">
              {selected ? 'Editing note' : 'Nebula Notes'}
            </span>
            {selected && (
              <>
                <button className="btn btn--sm btn--ghost" onClick={create}>
                  <Plus size={12} /> New
                </button>
                <button className="btn btn--sm btn--ghost" onClick={remove} title="Delete note">
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>

          {selected ? (
            <div className="notes-editor">
              <input
                ref={titleRef}
                className="notes-editor__title"
                placeholder="Untitled note"
                value={selected.title}
                onChange={(e) => update({ title: e.target.value })}
              />
              <div className="notes-editor__meta">
                <Feather size={11} />
                Edited {timeAgo(selected.updatedAt)} · saves itself
              </div>
              <textarea
                className="notes-editor__body"
                placeholder="Start writing. There's no wrong way to do this…"
                value={selected.body}
                onChange={(e) => update({ body: e.target.value })}
                spellCheck
              />
              <div className="notes-editor__foot">
                <span className="notes-editor__foot-left">
                  <Feather size={11} /> stored locally · never uploaded
                </span>
                <span>
                  {words(selected.body)} words · {Math.max(1, Math.ceil(words(selected.body) / 220))} min read
                </span>
              </div>
            </div>
          ) : (
            <div className="notes-empty">
              <Feather size={24} />
              <h3>A blank sky</h3>
              <p>No note selected. Start something new — it only takes a sentence.</p>
              <button className="btn btn--sm btn--primary" onClick={create}>
                <Plus size={12} /> Write a note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
