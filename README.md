<div align="center">

# ✦ Star Browser

**A calmer, lighter browser workspace — a little extra, a lot less RAM.**

Built-in notes, mail, radio, a comet game and a night-sky guide, wrapped in a
browser shell that puts idle tabs to sleep.

`React 19` · `TypeScript` · `Vite` · no backend, no accounts, no telemetry

</div>

---

## Why another browser?

Chrome is a great engine and a heavy neighbour. Star takes the opposite bet: a
small, quick shell with genuinely useful things built in, and an aggressive
attitude toward tabs you are not using.

- **Tabs hibernate.** A background tab that has been idle for ten minutes (configurable)
  goes to sleep. Its title, favicon and place in the strip stay put; clicking it wakes
  it with its history intact. The active tab is never touched.
- **The whole shell is small.** The initial bundle is ~105 KB gzipped, and the six
  built-in apps are code-split — a page you never visit costs nothing.
- **A constellation of real tools.** Notes, a mail client, generative ambient radio,
  an arcade game, a sky guide and the manual. All local, all genuinely functional.
- **Local by default.** No accounts, no sync, no analytics. Bookmarks, history,
  settings, notes and mail live in `localStorage` on this device.

## Screenshots

| New tab | Constellation |
| --- | --- |
| ![New tab](docs/newtab.png) | ![Apps](docs/apps.png) |

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

## The constellation

| Page | Address | What it is |
| --- | --- | --- |
| Nebula Notes | `nebula.star` | A quiet, local-first notes app with autosave |
| Orbit Mail | `orbit.star` | A demo inbox: folders, starring, compose, replies |
| Comet Catcher | `comet.star` | 45-second canvas arcade game, mouse/touch/keyboard |
| Stellar Docs | `docs.star` | The manual — memory, shortcuts, privacy |
| Focus Radio | `radio.star` | Three ambient stations synthesised live with Web Audio |
| Night Sky | `sky.star` | Moon phase, sun times, constellations, meteor showers |

Star's own pages live under `star://`:

`star://newtab` · `star://search?q=…` · `star://history` · `star://bookmarks` ·
`star://settings` · `star://about` · `star://external?url=…` (the portal)

## Keyboard

Single keys work when you are not typing in a field.

| Key | Action |
| --- | --- |
| `/` | Focus the address bar |
| `t` | New tab |
| `⌘K` / `Ctrl K` | Command palette |
| `h` / `b` / `,` | History / bookmarks / settings |
| `m` | Hibernate idle tabs |
| `z` | Zen mode |
| `u` | Reopen the last closed tab |
| `1`–`9` | Jump to that tab |
| `?` | Shortcut sheet |
| `Esc` | Close a menu, leave zen |

## The memory story, honestly

Star is a web app, so the browser does not let it read true process memory — the
megabyte figures are a deliberately conservative model of what each page would
cost. What is real is the behaviour: hibernated tabs drop their live page state
(the canvas stops, the audio graph is torn down, mounted components unmount) and
wake instantly when clicked. The habit is the feature.

## External pages

Star does not pretend to be a rendering engine. Typing an external address opens
the **portal**: a small hand-off page that opens the site in your system browser,
with copy-link, bookmark and back actions. That is also why the address bar shows
a globe instead of a star for those pages.

## Architecture

```
src/
  App.tsx              shell, routing, global shortcuts, zen mode
  store/browser.tsx    reducer + persistence: tabs, history, bookmarks,
                       settings, hibernation, toasts
  components/          chrome pieces (tabs, omnibox, memory panel, palette…)
  pages/               star:// pages and the external portal
  apps/                the six constellation apps (lazy-loaded)
  lib/                 parsing, search index, sky maths, storage helpers
  styles/              design tokens + components + page styles
```

State is a single reducer persisted to `localStorage`; the theme is a
`data-theme` attribute on `<html>` with three token sets (`midnight`, `eclipse`,
`daylight`). No state library, no router — navigation is just a URL on the active
tab.

## Privacy

Star makes no network requests except two optional ones: the public Google
suggest endpoint for omnibox autocomplete (only while you type in the bar, and it
can fail silently), and the page you explicitly hand to your system browser.
Search suggestions from the constellation, history and bookmarks are computed
locally.

Export everything as JSON, or erase it all, in **Settings → Privacy & data**.

---

<div align="center">
Made for people who keep too many tabs open.
</div>
