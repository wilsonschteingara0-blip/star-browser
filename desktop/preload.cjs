// Star Browser — preload bridge.
//
// The renderer gets a deliberately small, promise-shaped API. No Node, no
// ipcRenderer, no webContents objects: just the handful of things the Star
// chrome needs from the Chromium shell.
'use strict'

const { contextBridge, ipcRenderer } = require('electron')

function subscribe(channel, callback) {
  const listener = (_event, payload) => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('starDesktop', {
  isDesktop: true,
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome || '',
    electron: process.versions.electron || '',
    node: process.versions.node || '',
  },

  window: {
    minimize: () => ipcRenderer.invoke('star:window:action', 'minimize'),
    toggleMaximize: () => ipcRenderer.invoke('star:window:action', 'toggle-maximize'),
    close: () => ipcRenderer.invoke('star:window:action', 'close'),
    isMaximized: () => ipcRenderer.invoke('star:window:state'),
  },

  openExternal: (url) => ipcRenderer.invoke('star:open-external', url),
  guestMemory: (id) => ipcRenderer.invoke('star:guest-memory', id),

  onOpenTab: (callback) => subscribe('star:open-tab', callback),
  onShortcut: (callback) => subscribe('star:shortcut', callback),
  onDownload: (callback) => subscribe('star:download', callback),
  onWindowState: (callback) => subscribe('star:window-state', callback),
})
