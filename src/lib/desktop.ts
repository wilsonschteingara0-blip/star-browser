// The bridge to Chromium, when Star is running as a desktop app.
//
// In the web preview window.starDesktop does not exist and every helper here
// degrades gracefully: the UI keeps working, external pages go through the
// portal, and the engine badge says so honestly.

export interface GuestMemoryInfo {
  /** Kilobytes, as reported by Chromium's own process counters. */
  private: number
  shared: number
  residentSet: number
}

export interface DownloadEvent {
  phase: 'start' | 'done'
  filename: string
  url?: string
  state?: 'completed' | 'cancelled' | 'interrupted'
  path?: string
}

export interface StarDesktopApi {
  isDesktop: true
  platform: string
  versions: { chrome: string; electron: string; node: string }
  window: {
    minimize: () => Promise<boolean>
    toggleMaximize: () => Promise<boolean>
    close: () => Promise<boolean>
    isMaximized: () => Promise<boolean>
  }
  openExternal: (url: string) => Promise<boolean>
  guestMemory: (webContentsId: number) => Promise<GuestMemoryInfo | null>
  onOpenTab: (callback: (payload: { url: string }) => void) => () => void
  onShortcut: (callback: (action: string) => void) => () => void
  onDownload: (callback: (payload: DownloadEvent) => void) => () => void
  onWindowState: (callback: (maximized: boolean) => void) => () => void
}

declare global {
  interface Window {
    starDesktop?: StarDesktopApi
  }
}

export function desktop(): StarDesktopApi | null {
  if (typeof window === 'undefined') return null
  return window.starDesktop ?? null
}

export function isDesktop(): boolean {
  return desktop() !== null
}

export function chromiumVersion(): string {
  return desktop()?.versions.chrome ?? ''
}

export function chromiumMajor(): string {
  const version = chromiumVersion()
  return version ? version.split('.')[0] : ''
}

export function electronVersion(): string {
  return desktop()?.versions.electron ?? ''
}

/** Short, honest label for the engine doing the rendering. */
export function engineLabel(): string {
  const major = chromiumMajor()
  return major ? `Chromium ${major}` : 'Web preview'
}

export function engineDetail(): string {
  const api = desktop()
  if (!api) return "Your browser's engine"
  return `Chromium ${chromiumMajor()} · Electron ${electronVersion()}`
}

export function openExternalUrl(url: string) {
  const api = desktop()
  if (api) {
    void api.openExternal(url)
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

export const CHROMIUM_GITHUB = 'https://github.com/chromium/chromium'
export const ELECTRON_GITHUB = 'https://github.com/electron/electron'
