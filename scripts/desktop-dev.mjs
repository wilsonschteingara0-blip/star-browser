#!/usr/bin/env node
// Starts Vite, waits for it, then launches the Chromium shell against it.
// One command, two processes, clean shutdown together.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import process from 'node:process'

const require = createRequire(import.meta.url)
const PORT = 5173
const DEV_URL = `http://localhost:${PORT}`
const isWindows = process.platform === 'win32'
const npm = isWindows ? 'npm.cmd' : 'npm'

let electronPath = ''
try {
  electronPath = require('electron')
} catch {
  console.error(
    '\nStar Browser: the Electron binary is missing.\n' +
      'Run `npm install` (or `node node_modules/electron/install.js`) once, then try again.\n',
  )
  process.exit(1)
}

const vite = spawn(npm, ['run', 'dev'], {
  stdio: 'inherit',
  env: process.env,
  shell: isWindows,
})

let electron = null
let shuttingDown = false

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  if (electron && !electron.killed) electron.kill()
  if (!vite.killed) vite.kill()
  setTimeout(() => process.exit(code), 120)
}

vite.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`\nVite stopped (exit ${code ?? 0}). Star Browser is closing.\n`)
    shutdown(code ?? 0)
  }
})

async function waitForVite() {
  const deadline = Date.now() + 45_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(DEV_URL, { method: 'GET' })
      if (response.ok) return true
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 350))
  }
  return false
}

const ready = await waitForVite()
if (!ready) {
  console.error(`\nVite did not answer at ${DEV_URL}. Check the log above.\n`)
  shutdown(1)
} else {
  console.log('\n  ✦ Chromium is taking over from here…\n')
  electron = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    env: { ...process.env, STAR_DEV_URL: DEV_URL },
  })
  electron.on('exit', (code) => {
    console.log('\n  ✦ Chromium closed. Back to the stars.\n')
    shutdown(code ?? 0)
  })
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0))
}
