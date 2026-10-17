#!/usr/bin/env node
// Build the renderer, then open Star inside Chromium.
// Gives a human error if Electron's binary hasn't been downloaded yet.
import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import process from 'node:process'

const require = createRequire(import.meta.url)
const isWindows = process.platform === 'win32'
const npm = isWindows ? 'npm.cmd' : 'npm'

let electronPath = ''
try {
  electronPath = require('electron')
} catch {
  console.error(
    '\nStar Browser: the Electron (Chromium) binary is not installed.\n' +
      'Run `npm install` once with network access, then `npm run desktop` again.\n' +
      'If the download is blocked, set ELECTRON_MIRROR to a mirror and reinstall.\n',
  )
  process.exit(1)
}

console.log('\n  ✦ Building Star…\n')
const build = spawnSync(npm, ['run', 'build'], { stdio: 'inherit', shell: isWindows })
if (build.status !== 0) process.exit(build.status ?? 1)

console.log('\n  ✦ Opening Chromium…\n')
const child = spawn(electronPath, ['.'], { stdio: 'inherit' })

child.on('exit', (code) => process.exit(code ?? 0))
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!child.killed) child.kill()
    process.exit(0)
  })
}
