import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, Sparkles, Star } from 'lucide-react'
import { loadLocal, saveLocal } from '../lib/storage'

const DURATION = 45
const BEST_KEY = 'star-browser:comet-best'

type Status = 'idle' | 'playing' | 'paused' | 'over'

interface Comet {
  x: number
  y: number
  r: number
  speed: number
  angle: number
  spin: number
  hue: number
  wobble: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  hue: number
  size: number
}

interface Popup {
  x: number
  y: number
  life: number
  text: string
}

interface StarDot {
  x: number
  y: number
  r: number
  tw: number
}

interface GameData {
  w: number
  h: number
  playerX: number
  targetX: number
  comets: Comet[]
  particles: Particle[]
  popups: Popup[]
  stars: StarDot[]
  spawn: number
  elapsed: number
  last: number
  score: number
  lives: number
  status: Status
  shake: number
  uiClock: number
  playerVel: number
}

function freshData(w = 800, h = 450): GameData {
  return {
    w,
    h,
    playerX: w / 2,
    targetX: w / 2,
    comets: [],
    particles: [],
    popups: [],
    stars: Array.from({ length: 70 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.4 + Math.random() * 1.2,
      tw: Math.random() * 6,
    })),
    spawn: 0.5,
    elapsed: 0,
    last: 0,
    score: 0,
    lives: 3,
    status: 'idle',
    shake: 0,
    uiClock: 0,
    playerVel: 0,
  }
}

function makeStars(w: number, h: number): StarDot[] {
  return Array.from({ length: 80 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0.4 + Math.random() * 1.3,
    tw: Math.random() * 6,
  }))
}

export function CometGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<GameData>(freshData())
  const [status, setStatus] = useState<Status>('idle')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [lives, setLives] = useState(3)
  const [best, setBest] = useState(() => loadLocal<number>(BEST_KEY, 0))
  const [newBest, setNewBest] = useState(false)

  const start = () => {
    const g = gameRef.current
    const w = g.w
    const h = g.h
    const stars = g.stars.length > 0 ? g.stars : makeStars(w, h)
    Object.assign(g, freshData(w, h))
    g.stars = stars
    g.status = 'playing'
    setStatus('playing')
    setScore(0)
    setLives(3)
    setTimeLeft(DURATION)
    setNewBest(false)
  }

  const pause = () => {
    const g = gameRef.current
    if (g.status !== 'playing') return
    g.status = 'paused'
    setStatus('paused')
  }

  const resume = () => {
    const g = gameRef.current
    if (g.status !== 'paused') return
    g.status = 'playing'
    g.last = 0
    setStatus('playing')
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const g = gameRef.current
      const oldW = g.w || rect.width
      const scale = rect.width / oldW || 1
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.w = rect.width
      g.h = rect.height
      g.stars = makeStars(g.w, g.h)
      if (g.status === 'idle') {
        g.playerX = g.w / 2
        g.targetX = g.w / 2
      } else {
        g.playerX = Math.min(g.w - 60, Math.max(60, g.playerX * scale))
        g.targetX = Math.min(g.w - 60, Math.max(60, g.targetX * scale))
      }
    }

    const finish = () => {
      const g = gameRef.current
      if (g.status === 'over') return
      g.status = 'over'
      setStatus('over')
      setTimeLeft(0)
      setBest((current) => {
        if (g.score > current) {
          saveLocal(BEST_KEY, g.score)
          setNewBest(true)
          return g.score
        }
        return current
      })
    }

    const spawnComet = () => {
      const g = gameRef.current
      const margin = 46
      const maxR = 8 + Math.min(7, g.elapsed * 0.16)
      const r = 7 + Math.random() * maxR
      const palette = [42, 330, 205, 158, 276]
      g.comets.push({
        x: margin + Math.random() * (g.w - margin * 2),
        y: -24,
        r,
        speed: g.h * (0.17 + Math.random() * 0.1) + g.elapsed * 1.5,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 1.4,
        hue: palette[Math.floor(Math.random() * palette.length)],
        wobble: Math.random() * Math.PI * 2,
      })
    }

    const burst = (x: number, y: number, hue: number) => {
      const g = gameRef.current
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2
        const speed = 40 + Math.random() * 170
        g.particles.push({
          x,
          y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - 40,
          life: 0.5 + Math.random() * 0.55,
          max: 1.05,
          hue: hue + (Math.random() * 30 - 15),
          size: 1 + Math.random() * 2.4,
        })
      }
      g.popups.push({ x, y: y - 8, life: 0.9, text: '+1' })
    }

    const update = (dt: number) => {
      const g = gameRef.current
      g.elapsed += dt
      if (g.elapsed >= DURATION) {
        finish()
        return
      }
      g.playerX += (g.targetX - g.playerX) * Math.min(1, dt * 14)
      g.shake = Math.max(0, g.shake - dt * 2.2)

      g.spawn -= dt
      if (g.spawn <= 0) {
        spawnComet()
        g.spawn = Math.max(0.32, 0.82 - g.elapsed * 0.0085)
      }

      const catchY = g.h - 64
      const halfWidth = 56

      for (let i = g.comets.length - 1; i >= 0; i--) {
        const c = g.comets[i]
        c.y += c.speed * dt
        c.angle += c.spin * dt
        c.wobble += dt * 1.6
        c.x += Math.sin(c.wobble) * 9 * dt

        if (c.y >= catchY - 6 && c.y <= g.h - 18 && Math.abs(c.x - g.playerX) < halfWidth + c.r * 0.4) {
          g.comets.splice(i, 1)
          g.score += 1
          burst(c.x, catchY - 16, c.hue)
          continue
        }

        if (c.y - c.r > g.h + 16) {
          g.comets.splice(i, 1)
          g.lives -= 1
          g.shake = 1
          g.popups.push({ x: c.x, y: g.h - 60, life: 0.9, text: 'missed' })
          if (g.lives <= 0) {
            finish()
            return
          }
        }
      }

      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i]
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 240 * dt
        p.vx *= 0.985
        p.life -= dt
        if (p.life <= 0) g.particles.splice(i, 1)
      }
      for (let i = g.popups.length - 1; i >= 0; i--) {
        const p = g.popups[i]
        p.y -= 26 * dt
        p.life -= dt
        if (p.life <= 0) g.popups.splice(i, 1)
      }

      g.uiClock += dt
      if (g.uiClock > 0.12) {
        g.uiClock = 0
        setScore(g.score)
        setTimeLeft(Math.max(0, Math.ceil(DURATION - g.elapsed)))
        setLives(Math.max(0, g.lives))
      }
    }

    const draw = (time: number) => {
      const g = gameRef.current
      const { w, h } = g

      ctx.clearRect(0, 0, w, h)

      const sky = ctx.createLinearGradient(0, 0, 0, h)
      sky.addColorStop(0, '#0b1022')
      sky.addColorStop(0.55, '#080c18')
      sky.addColorStop(1, '#05070f')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)

      const glow = ctx.createRadialGradient(w * 0.72, h * 0.18, 0, w * 0.72, h * 0.18, h * 0.75)
      glow.addColorStop(0, 'rgba(120, 140, 255, 0.13)')
      glow.addColorStop(1, 'rgba(120, 140, 255, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      if (g.shake > 0) {
        ctx.save()
        ctx.translate((Math.random() - 0.5) * 9 * g.shake, (Math.random() - 0.5) * 9 * g.shake)
      }

      // stars
      for (const s of g.stars) {
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 0.0012 + s.tw))
        ctx.globalAlpha = tw * 0.8
        ctx.fillStyle = '#fff7e2'
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // distant moon
      const moonX = w * 0.14
      const moonY = h * 0.2
      const moon = ctx.createRadialGradient(moonX - 4, moonY - 5, 1, moonX, moonY, 22)
      moon.addColorStop(0, 'rgba(255, 245, 214, 0.9)')
      moon.addColorStop(1, 'rgba(255, 235, 190, 0.05)')
      ctx.fillStyle = moon
      ctx.beginPath()
      ctx.arc(moonX, moonY, 21, 0, Math.PI * 2)
      ctx.fill()

      const idleBob = g.status !== 'playing' ? Math.sin(time * 0.0012) * 10 : 0
      const px = g.playerX + idleBob
      const py = h - 46

      // ground glow
      const ground = ctx.createRadialGradient(px, py + 8, 4, px, py + 8, 130)
      ground.addColorStop(0, 'rgba(255, 200, 120, 0.2)')
      ground.addColorStop(1, 'rgba(255, 200, 120, 0)')
      ctx.fillStyle = ground
      ctx.fillRect(px - 140, py - 120, 280, 190)

      // basket
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineWidth = 7
      const basketGradient = ctx.createLinearGradient(px - 54, 0, px + 54, 0)
      basketGradient.addColorStop(0, '#ff9f6b')
      basketGradient.addColorStop(0.5, '#ffd88f')
      basketGradient.addColorStop(1, '#ff9f6b')
      ctx.strokeStyle = basketGradient
      ctx.shadowColor = 'rgba(255, 200, 120, 0.65)'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.arc(px, py, 50, Math.PI * 0.12, Math.PI * 0.88)
      ctx.stroke()
      ctx.restore()

      // small center sparkle
      ctx.save()
      ctx.fillStyle = 'rgba(255, 235, 190, 0.9)'
      ctx.beginPath()
      ctx.arc(px, py + 16, 2.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // comets
      for (const c of g.comets) {
        const tail = ctx.createLinearGradient(c.x, c.y - c.r * 5, c.x, c.y + c.r)
        tail.addColorStop(0, `hsla(${c.hue}, 90%, 70%, 0)`)
        tail.addColorStop(1, `hsla(${c.hue}, 90%, 72%, 0.55)`)
        ctx.strokeStyle = tail
        ctx.lineWidth = c.r * 0.8
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(c.x + Math.sin(c.angle) * 5, c.y - c.r * 5)
        ctx.lineTo(c.x, c.y)
        ctx.stroke()

        const body = ctx.createRadialGradient(c.x - c.r * 0.3, c.y - c.r * 0.3, 0.5, c.x, c.y, c.r)
        body.addColorStop(0, '#fffdf4')
        body.addColorStop(0.45, `hsl(${c.hue}, 92%, 76%)`)
        body.addColorStop(1, `hsl(${c.hue}, 82%, 55%)`)
        ctx.fillStyle = body
        ctx.shadowColor = `hsla(${c.hue}, 90%, 68%, 0.7)`
        ctx.shadowBlur = 16
        ctx.beginPath()
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // particles
      for (const p of g.particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.max)
        ctx.fillStyle = `hsl(${p.hue}, 90%, 72%)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // popups
      for (const p of g.popups) {
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.text === 'missed' ? 'rgba(255, 150, 150, 0.9)' : '#ffd88f'
        ctx.font = `600 ${p.text === 'missed' ? 11 : 14}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(p.text, p.x, p.y)
      }
      ctx.globalAlpha = 1

      if (g.shake > 0) ctx.restore()
    }

    const frame = (time: number) => {
      const g = gameRef.current
      if (g.last === 0) g.last = time
      const dt = Math.min((time - g.last) / 1000, 0.05)
      g.last = time
      if (g.status === 'playing') update(dt)
      draw(time)
      raf = requestAnimationFrame(frame)
    }

    resize()
    raf = requestAnimationFrame(frame)
    const observer = new ResizeObserver(resize)
    observer.observe(wrap)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  // pointer control
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const move = (clientX: number) => {
      const g = gameRef.current
      if (g.status !== 'playing') return
      const rect = canvas.getBoundingClientRect()
      g.targetX = Math.min(g.w - 58, Math.max(58, clientX - rect.left))
    }
    const onPointer = (e: PointerEvent) => move(e.clientX)
    canvas.addEventListener('pointermove', onPointer)
    canvas.addEventListener('pointerdown', onPointer)
    return () => {
      canvas.removeEventListener('pointermove', onPointer)
      canvas.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  // keyboard control
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      const g = gameRef.current
      if (g.status === 'playing' || g.status === 'paused') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault()
          g.targetX = Math.max(58, g.targetX - 46)
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault()
          g.targetX = Math.min(g.w - 58, g.targetX + 46)
        } else if (e.key === ' ') {
          e.preventDefault()
          if (g.status === 'playing') pause()
          else resume()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const timeLabel = `0:${String(Math.max(0, timeLeft)).padStart(2, '0')}`

  return (
    <div className="game-page">
      <div className="game-head">
        <div>
          <div className="game-head__title">
            <Sparkles size={22} /> Comet Catcher
          </div>
          <div className="game-head__sub">
            A tiny arcade, built into Star. Forty-five seconds of falling stars.
          </div>
        </div>
        <div className="game-scores">
          <div className="score-chip">
            <div className="score-chip__label">Score</div>
            <div className="score-chip__value">{score}</div>
          </div>
          <div className="score-chip">
            <div className="score-chip__label">Time</div>
            <div className="score-chip__value">{timeLabel}</div>
          </div>
          <div className="score-chip">
            <div className="score-chip__label">Lives</div>
            <div className="score-chip__value">{'★'.repeat(lives) || '—'}</div>
          </div>
          <div className="score-chip">
            <div className="score-chip__label">Best</div>
            <div className="score-chip__value">{best}</div>
          </div>
        </div>
      </div>

      <div className="game-stage" ref={wrapRef}>
        <canvas ref={canvasRef} />
        {status !== 'playing' && (
          <div className="game-overlay">
            {status === 'idle' && (
              <>
                <div className="game-overlay__title">
                  Catch a falling <em>star</em>
                </div>
                <p>
                  Move the little basket with your mouse, your finger or the arrow keys. Let three
                  comets slip past and the sky closes up shop.
                </p>
                <button className="btn btn--primary" onClick={start}>
                  <Play size={14} /> Start catching
                </button>
              </>
            )}
            {status === 'paused' && (
              <>
                <div className="game-overlay__title">
                  Holding the <em>sky</em>
                </div>
                <p>The comets are waiting politely. No rush.</p>
                <button className="btn btn--primary" onClick={resume}>
                  <Play size={14} /> Keep playing
                </button>
              </>
            )}
            {status === 'over' && (
              <>
                <div className="game-overlay__title">
                  {newBest ? (
                    <>
                      A new <em>best</em>
                    </>
                  ) : (
                    <>
                      Stardust and <em>quiet</em>
                    </>
                  )}
                </div>
                <p>
                  You caught <strong style={{ color: 'var(--gold)' }}>{score}</strong>{' '}
                  {score === 1 ? 'comet' : 'comets'}. Best so far: {Math.max(best, score)}.
                  {newBest ? ' The sky remembers.' : ' The sky is patient — go again?'}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn--primary" onClick={start}>
                    <RotateCcw size={13} /> Play again
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      const g = gameRef.current
                      Object.assign(g, freshData(g.w, g.h))
                      g.stars = makeStars(g.w, g.h)
                      setStatus('idle')
                      setScore(0)
                      setLives(3)
                      setTimeLeft(DURATION)
                    }}
                  >
                    Back to the sky
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {status === 'playing' && (
          <button
            className="icon-btn"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(1, 5, 14, 0.5)',
              color: '#f3f0e6',
              backdropFilter: 'blur(8px)',
            }}
            onClick={pause}
            aria-label="Pause game"
          >
            <Pause size={14} />
          </button>
        )}
      </div>

      <div className="game-foot">
        <div className="game-keys">
          <span>
            <kbd>←</kbd>
            <kbd>→</kbd> or <kbd>A</kbd>
            <kbd>D</kbd> to steer
          </span>
          <span>
            <kbd>space</kbd> to pause
          </span>
          <span>or use a mouse / fingertip</span>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Star size={10} color="var(--gold)" /> best score saved on this device
        </span>
      </div>

      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', fontSize: 10.5, color: 'var(--faint)', marginTop: 2 }}>
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
          <ArrowLeft size={10} /> left
        </span>
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
          right <ArrowRight size={10} />
        </span>
        <span>no sound, no ads, no app store</span>
      </div>
    </div>
  )
}
