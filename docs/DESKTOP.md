# Star Browser on Chromium

Star's desktop edition is a real Chromium browser. The Star chrome is React; the
web pages are Chromium. This file explains how the two meet, what is locked down,
and what to expect when running it.

## Run

```bash
npm install       # once; downloads the Chromium runtime
npm run desktop   # build the renderer, then open the window
```

For development, one command starts Vite and the shell together:

```bash
npm run desktop:dev
```

`npm run desktop:dev` waits for Vite on port 5173, launches Electron against it,
and shuts both down together. Vite hot-reloads the Star chrome; `F12` (or
`Ctrl/Cmd + Shift + I`) opens DevTools on the focused page in development.

The web preview (`npm run dev`, `npm run preview`) never loads Electron. It shows
the portal for external addresses and says "Web preview" in the status bar.

## How a tab is put together

```
┌────────────────────────────── BrowserWindow (Chromium) ──────────────────────────────┐
│  Star chrome — React renderer, sandboxed, preload = starDesktop bridge               │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ <webview> guest (per awake external tab)                                        │  │
│  │  sandbox on · contextIsolation on · node off · no preload · persist:star session │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│  main process: window, IPC, permissions, downloads, shortcuts, native menu           │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- Every awake external tab gets one `<webview>` in `src/components/ChromiumLayer.tsx`.
- `SYNC_TAB` mirrors Chromium's URL, title, favicon and back/forward capability
  into the tab model. Typing an address dispatches a navigation, and the surface
  calls `loadURL`.
- The toolbar uses `navigation.registerNavController` so back/forward/reload talk
  to the guest's real session history, not a React copy.
- Closing or hibernating a tab unmounts its surface. Removing a `<webview>`
  destroys the guest renderer; that is where the memory goes.
- Restored background tabs are hydrated asleep, so a twenty-tab session does not
  boot twenty renderers.

## Memory, measured

`desktop/main.cjs` exposes `getProcessMemoryInfo()` for a guest's webContents ID.
`ChromiumLayer` polls it every eight seconds and writes the resident-set size into
`tab.memoryMB`. The memory panel and the Settings table say "measured" when this
is live. The browser chrome itself (Star's own window) still uses a conservative
baseline; that part is a model in both editions.

One honest caveat: Chromium sometimes places several same-site tabs in one
renderer process. Those tabs then report the same process figure, so the total can
double-count shared memory. Hibernating one of them only frees memory once the
last tab using that process is gone. Browsers' own task managers have the same
shape of caveat.

## Security model

- Host window: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- `will-attach-webview` strips any preload, forces sandbox and context isolation,
  disables Node, and rejects non-`http(s)` guests.
- Guests share `persist:star`; no preload and no bridge are injected into them.
- Permissions are deny-by-default. Only `fullscreen`, `clipboard-sanitized-write`
  and `pointerLock` are granted.
- The host cannot navigate away from Star (`will-navigate` is blocked).
- Links that request a new window are intercepted and opened as Star tabs; the
  host itself only opens `http(s)`/`mailto:` through the OS.
- IPC handlers check that the sender is the Star window, and the memory endpoint
  only accepts a numeric webContents ID.
- DevTools for guests are available in development (`STAR_DEV_URL` set).

If you want a stricter build, remove `webviewTag: true` and switch to
`WebContentsView` with main-process tab management; the React side would then talk
to a controller over IPC instead of owning the guest element. That is a larger
change and loses the pleasant "unmount means destroy" ergonomics.

## Shortcuts that work inside a page

The main process listens on each guest's `before-input-event` and forwards:

`Ctrl/Cmd T` new tab · `Ctrl/Cmd Shift T` reopen · `Ctrl/Cmd W` close ·
`Ctrl/Cmd L` address bar · `Ctrl/Cmd K` palette · `Ctrl/Cmd F` find in page ·
`Ctrl/Cmd R` reload ·
`Ctrl/Cmd Shift R` hard reload · `Ctrl/Cmd +` / `-` / `0` zoom and reset ·
`Ctrl Tab` / `Ctrl Shift Tab` cycle ·
`Ctrl/Cmd 1–9` jump · `Alt ←/→` back/forward · `F5` reload ·
`F12` DevTools (development only behaviour).

Because the keys are intercepted in the main process, they work whether focus is
on the Star chrome or inside a page.

## Downloads and menus

Downloads go through Chromium's normal save dialog, with a start/finish toast in
Star. Right-click inside a page gets Back/Forward/Reload, open/copy link, cut/
copy/paste when editable, "Open page in system browser", and Inspect element in
development.

## Limits, deliberately

- No extension support, sync, profiles or Google services.
- One window; tabs hibernate instead of being moved to a separate process group.
- Hibernation reloads the page when it wakes (that is the trade for releasing the
  renderer). Cookies and logins persist in `persist:star`.
- No packaging/installer is wired up in this repo yet. For a distributable, use
  `electron-builder` or `@electron/packager` with `desktop/icon.png`; the app
  entry point is `desktop/main.cjs`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Electron failed to install correctly` | `npm install` was interrupted or the binary download was blocked. Re-run it, or set `ELECTRON_MIRROR` to a mirror. |
| Window opens but pages are blank | Check that the page uses `http(s)`. `about:` and `file:` guests are intentionally rejected. |
| Nothing loads and the status chip says "Web preview" | You are in the browser preview. Run `npm run desktop` (needs a graphical session). |
| Guest crashed | The error card offers Try again; the tab is still there. Hibernate it to guarantee the process is gone. |
| Want the engine versions | `star://about#engine` or `star://settings#engine` in the desktop app. |

## Files

| File | Job |
| --- | --- |
| `desktop/main.cjs` | window, guest security, shortcuts, context menu, downloads, IPC |
| `desktop/preload.cjs` | exposes `window.starDesktop`; no Node in the renderer |
| `scripts/desktop-dev.mjs` | Vite + Electron dev launcher |
| `src/lib/desktop.ts` | typed renderer bridge + engine helpers |
| `src/lib/navigation.ts` | per-tab Chromium history controllers |
| `src/components/ChromiumLayer.tsx` | guest lifecycle, URL/title sync, memory polling |
| `src/components/DesktopBridge.tsx` | listens to shell events, maps shortcuts |
| `src/components/WindowControls.tsx` | frameless titlebar controls |
| `src/styles/chromium.css` | webview layer, loading hairline, error card, titlebar |
