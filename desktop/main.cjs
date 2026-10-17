// Star Browser — Electron main process.
//
// Chromium is the engine. The Star chrome (tabs, omnibox, built-in apps) is
// rendered by the host renderer; external pages run in sandboxed <webview>
// guests on their own Chromium renderer processes. Closing or hibernating a
// tab destroys its guest, which is what actually gives the RAM back.
'use strict'

const { app, BrowserWindow, Menu, clipboard, ipcMain, session, shell, webContents } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const DEV_URL = process.env.STAR_DEV_URL || ''
const INDEX_PATH = path.join(__dirname, '..', 'dist', 'index.html')
const PARTITION = 'persist:star'
const IS_MAC = process.platform === 'darwin'

app.setName('Star Browser')
if (process.platform === 'win32') app.setAppUserModelId('com.starbrowser.app')

/** @type {BrowserWindow | null} */
let mainWindow = null
let downloadsHooked = false

/* ------------------------------------------------------------------ */
/* Session + downloads                                                 */
/* ------------------------------------------------------------------ */

function configureSession() {
  const ses = session.fromPartition(PARTITION)

  // Star has no permission prompt UI, so it only grants the handful of
  // permissions a browser page genuinely needs to behave. Everything else
  // (camera, microphone, location, notifications, MIDI…) is denied.
  const allowed = new Set(['fullscreen', 'clipboard-sanitized-write', 'pointerLock'])
  ses.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(allowed.has(permission))
  })
  ses.setPermissionCheckHandler((_contents, permission) => allowed.has(permission))

  if (downloadsHooked) return
  downloadsHooked = true

  ses.on('will-download', (_event, item) => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow
    const filename = item.getFilename()

    item.setSaveDialogOptions({
      title: 'Save from Star Browser',
      defaultPath: path.join(app.getPath('downloads'), filename),
    })

    if (win && !win.isDestroyed()) {
      win.webContents.send('star:download', { phase: 'start', filename, url: item.getURL() })
    }

    item.once('done', (_e, state) => {
      if (!win || win.isDestroyed()) return
      win.webContents.send('star:download', {
        phase: 'done',
        filename,
        state,
        path: state === 'completed' ? item.getSavePath() : '',
      })
    })
  })
}

/* ------------------------------------------------------------------ */
/* Window                                                              */
/* ------------------------------------------------------------------ */

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 940,
    minHeight: 620,
    show: false,
    frame: false,
    backgroundColor: '#080b18',
    title: 'Star Browser',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
      spellcheck: true,
      webSecurity: true,
    },
  })

  mainWindow = win

  win.once('ready-to-show', () => win.show())
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })

  const publishMaximized = () => {
    if (!win.isDestroyed()) win.webContents.send('star:window-state', win.isMaximized())
  }
  win.on('maximize', publishMaximized)
  win.on('unmaximize', publishMaximized)

  // The host page never navigates away from Star itself.
  win.webContents.on('will-navigate', (event) => event.preventDefault())

  // Links in Star's own pages (target=_blank etc.) become Star tabs.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) {
      win.webContents.send('star:open-tab', { url })
    } else if (/^(mailto|tel):/i.test(url)) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Every guest gets the same guarded webPreferences, whatever the renderer
  // asked for, and only http(s) guests are allowed at all.
  win.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    delete webPreferences.preload
    webPreferences.nodeIntegration = false
    webPreferences.contextIsolation = true
    webPreferences.sandbox = true
    webPreferences.webSecurity = true
    if (!/^https?:/i.test(params.src || '')) event.preventDefault()
  })

  if (DEV_URL) {
    win.loadURL(DEV_URL)
  } else if (fs.existsSync(INDEX_PATH)) {
    win.loadFile(INDEX_PATH)
  } else {
    win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(
        '<body style="background:#080b18;color:#f5efe3;font:16px system-ui;padding:48px">' +
          '<h2>Star Browser is not built yet</h2>' +
          '<p>Run <code>npm run build</code> first, or start the desktop app in dev mode with ' +
          '<code>npm run desktop:dev</code>.</p></body>',
      )}`,
    )
  }

  return win
}

/* ------------------------------------------------------------------ */
/* Guest webContents                                                   */
/* ------------------------------------------------------------------ */

app.on('web-contents-created', (_event, contents) => {
  if (contents.getType() !== 'webview') return

  contents.setWindowOpenHandler(({ url }) => {
    const host = contents.hostWebContents
    if (host && !host.isDestroyed()) {
      if (/^https?:/i.test(url)) host.send('star:open-tab', { url })
      else if (/^(mailto|tel):/i.test(url)) shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  const guardNavigation = (event, url) => {
    if (!/^(https?|about):/i.test(url)) event.preventDefault()
  }
  contents.on('will-navigate', guardNavigation)
  contents.on('will-redirect', guardNavigation)

  contents.on('before-input-event', (event, input) => {
    const host = contents.hostWebContents
    if (!host || host.isDestroyed()) return
    forwardShortcut(host, contents, event, input)
  })

  // A small native context menu, like a real browser's.
  contents.on('context-menu', (_event, params) => {
    const host = contents.hostWebContents
    const win = host && BrowserWindow.fromWebContents(host)
    if (!win) return

    const history = contents.navigationHistory
    const canBack = history && typeof history.canGoBack === 'function' ? history.canGoBack() : false
    const canForward =
      history && typeof history.canGoForward === 'function' ? history.canGoForward() : false
    const link = /^https?:/i.test(params.linkURL || '') ? params.linkURL : ''
    const page = /^https?:/i.test(params.pageURL || '') ? params.pageURL : ''

    /** @type {Electron.MenuItemConstructorOptions[]} */
    const template = [
      {
        label: 'Back',
        enabled: canBack,
        click: () => history && history.goBack(),
      },
      {
        label: 'Forward',
        enabled: canForward,
        click: () => history && history.goForward(),
      },
      { label: 'Reload', click: () => contents.reload() },
      { type: 'separator' },
    ]

    if (link) {
      template.push(
        {
          label: 'Open link in new Star tab',
          click: () => host.send('star:open-tab', { url: link }),
        },
        { label: 'Copy link address', click: () => clipboard.writeText(link) },
        { type: 'separator' },
      )
    }

    if (params.isEditable) {
      template.push(
        { label: 'Cut', enabled: params.editFlags.canCut, click: () => contents.cut() },
        { label: 'Copy', enabled: params.editFlags.canCopy, click: () => contents.copy() },
        { label: 'Paste', enabled: params.editFlags.canPaste, click: () => contents.paste() },
        { label: 'Select all', click: () => contents.selectAll() },
        { type: 'separator' },
      )
    } else if (params.selectionText) {
      template.push({ label: 'Copy', click: () => contents.copy() }, { type: 'separator' })
    }

    template.push({
      label: 'Open page in system browser',
      enabled: !!page,
      click: () => page && shell.openExternal(page),
    })

    if (process.env.STAR_DEV_URL) {
      template.push(
        { type: 'separator' },
        {
          label: 'Inspect element',
          click: () => contents.inspectElement(params.x, params.y),
        },
      )
    }

    Menu.buildFromTemplate(template).popup({ window: win })
  })
})

/** Turn browser shortcuts pressed inside a page into Star commands. */
function forwardShortcut(host, guest, event, input) {
  if (input.type !== 'keyDown') return

  const mod = input.control || input.meta
  const key = String(input.key)
  const lower = key.toLowerCase()
  let action = ''

  // Page zoom lives on the guest's webContents, not in the Star chrome.
  if (mod && (key === '=' || key === '+')) {
    event.preventDefault()
    guest.setZoomLevel(Math.min(guest.getZoomLevel() + 0.5, 5))
    return
  }
  if (mod && key === '-') {
    event.preventDefault()
    guest.setZoomLevel(Math.max(guest.getZoomLevel() - 0.5, -3))
    return
  }
  if (mod && key === '0') {
    event.preventDefault()
    guest.setZoomLevel(0)
    return
  }

  if (mod && lower === 't') action = input.shift ? 'reopen-tab' : 'new-tab'
  else if (mod && lower === 'w') action = 'close-tab'
  else if (mod && lower === 'l') action = 'focus-omnibox'
  else if (mod && lower === 'k') action = 'toggle-palette'
  else if (mod && lower === 'f') action = 'find-in-page'
  else if (mod && lower === 'r') action = input.shift ? 'hard-reload' : 'reload'
  else if (mod && lower === 'tab') action = input.shift ? 'prev-tab' : 'next-tab'
  else if (mod && /^[1-9]$/.test(key)) action = `tab-${key}`
  else if (input.alt && key === 'ArrowLeft') action = 'back'
  else if (input.alt && key === 'ArrowRight') action = 'forward'
  else if (key === 'F5') action = input.control ? 'hard-reload' : 'reload'
  else if (key === 'F12' || (mod && input.shift && lower === 'i')) action = 'devtools'

  if (!action) return
  event.preventDefault()

  if (action === 'devtools') {
    if (guest.isDevToolsOpened()) guest.closeDevTools()
    else guest.openDevTools({ mode: 'detach' })
    return
  }

  if (host.isDestroyed()) return
  host.focus()
  host.send('star:shortcut', action)
}

/* ------------------------------------------------------------------ */
/* IPC                                                                 */
/* ------------------------------------------------------------------ */

/** Only the Star window's own renderer may use these channels. */
function trusted(event) {
  return !!mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents
}

ipcMain.handle('star:window:action', (event, action) => {
  if (!trusted(event)) return false
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return false
  if (action === 'minimize') win.minimize()
  else if (action === 'toggle-maximize') {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  } else if (action === 'close') win.close()
  return win.isMaximized()
})

ipcMain.handle('star:window:state', (event) => {
  if (!trusted(event)) return false
  const win = BrowserWindow.fromWebContents(event.sender)
  return !!win && win.isMaximized()
})

ipcMain.handle('star:open-external', async (event, url) => {
  if (!trusted(event) || typeof url !== 'string') return false
  if (!/^(https?|mailto):/i.test(url)) return false
  await shell.openExternal(url)
  return true
})

ipcMain.handle('star:guest-memory', async (event, id) => {
  if (!trusted(event) || typeof id !== 'number') return null
  const guest = webContents.fromId(id)
  if (!guest || guest.isDestroyed()) return null
  try {
    return await guest.getProcessMemoryInfo()
  } catch {
    return null
  }
})

/* ------------------------------------------------------------------ */
/* Menu + app lifecycle                                                */
/* ------------------------------------------------------------------ */

function buildMenu() {
  if (!IS_MAC) {
    // Windows/Linux: the Star chrome is the whole UI.
    Menu.setApplicationMenu(null)
    return
  }
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: 'appMenu' },
      { role: 'editMenu' },
      { role: 'windowMenu' },
    ]),
  )
}

app.whenReady().then(() => {
  configureSession()
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!IS_MAC) app.quit()
})
