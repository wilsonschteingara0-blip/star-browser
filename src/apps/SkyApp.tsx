import { useMemo, useState } from 'react'
import { Compass, Eye, MoonStar, Sparkles, Star, Telescope, Moon, Sunrise, Sunset } from 'lucide-react'
import {
  CONSTELLATIONS,
  constellationForMonth,
  hemisphereNote,
  moonInfo,
  METEOR_SHOWERS,
  showerForMonth,
  sunTimes,
} from '../lib/sky'

export function SkyApp() {
  const now = new Date()
  const moon = useMemo(() => moonInfo(now), [])
  const featured = useMemo(() => constellationForMonth(now.getMonth() + 1), [])
  const [selectedId, setSelectedId] = useState(featured.id)
  const constellation = CONSTELLATIONS.find((c) => c.id === selectedId) ?? featured
  const shower = showerForMonth(now.getMonth() + 1)
  const sun = useMemo(() => sunTimes(now), [])
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const dayHours = Math.floor(sun.dayLengthMinutes / 60)
  const dayMinutes = sun.dayLengthMinutes % 60

  const nextFullDays = ((14.765 - moon.ageDays) % 29.530588853 + 29.530588853) % 29.530588853
  const nextFull = new Date(now.getTime() + nextFullDays * 86_400_000)
  const nextNewDays = ((29.530588853 - moon.ageDays) % 29.530588853 + 29.530588853) % 29.530588853
  const nextNew = new Date(now.getTime() + nextNewDays * 86_400_000)

  const backgroundStars = useMemo(() => {
    let seed = 77
    const random = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    return Array.from({ length: 26 }, () => ({
      x: 4 + random() * 92,
      y: 4 + random() * 92,
      r: 0.2 + random() * 0.5,
    }))
  }, [])

  return (
    <div className="sky-page">
      <div className="page__head" style={{ marginBottom: 20 }}>
        <div>
          <div className="page__eyebrow">
            <Telescope size={11} /> a pocket guide to looking up
          </div>
          <h1 className="page__title">Night Sky</h1>
          <p className="page__sub">
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} ·{' '}
            {hemisphereNote(now)}. Computed for wherever you are, using your own clock.
          </p>
        </div>
        <div className="chip" style={{ cursor: 'default' }}>
          <MoonStar size={11} /> {moon.name}
        </div>
      </div>

      <div className="sky-hero">
        <div className="sky-card sky-card--moon">
          <div className="sky-moon-wrap">
            <span className="sky-moon-wrap__ring" />
            <span
              className="sky-moon"
              style={{ '--moon-shift': `${moon.shiftPercent}%` } as React.CSSProperties}
            />
            <Star className="sky-moon-wrap__star" size={11} style={{ top: -16, right: 8 }} />
            <Sparkles className="sky-moon-wrap__star" size={9} style={{ bottom: 4, left: -12, opacity: 0.5 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="sky-card__label">
              <Moon size={10} /> Tonight's moon · {moon.emoji}
            </div>
            <div className="sky-card__big">{moon.name}</div>
            <div className="sky-card__meta">
              {Math.round(moon.illumination * 100)}% illuminated · {moon.ageDays.toFixed(1)} days into the
              lunar cycle
            </div>
            <div className="sky-moon-stats">
              <div>
                <strong>{Math.round(moon.illumination * 100)}%</strong>
                <span>lit</span>
              </div>
              <div>
                <strong>
                  {nextFull.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </strong>
                <span>next full</span>
              </div>
              <div>
                <strong>{nextNew.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</strong>
                <span>next new</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sky-card sky-card--map">
          <div className="sky-card__label" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Compass size={10} /> Find it tonight
            </span>
            <span style={{ letterSpacing: 0, textTransform: 'none', fontWeight: 500 }}>
              {constellation.name} · {constellation.latin}
            </span>
          </div>
          <div className="sky-map">
            <svg viewBox="0 0 100 100" aria-label={`${constellation.name} star pattern`}>
              {backgroundStars.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#cfd8ff" opacity={0.3} />
              ))}
              {constellation.lines.map(([a, b], i) => {
                const s1 = constellation.stars[a]
                const s2 = constellation.stars[b]
                if (!s1 || !s2) return null
                return (
                  <line
                    key={i}
                    className="constellation-line"
                    x1={s1.x}
                    y1={s1.y}
                    x2={s2.x}
                    y2={s2.y}
                  />
                )
              })}
              {constellation.stars.map((s, i) => (
                <circle key={i} className="star" cx={s.x} cy={s.y} r={s.size * 0.55} />
              ))}
            </svg>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
            {CONSTELLATIONS.map((c) => (
              <button
                key={c.id}
                className="chip"
                data-active={c.id === constellation.id}
                style={{ height: 24, fontSize: 10, padding: '0 8px' }}
                onClick={() => setSelectedId(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sky-grid">
        <div className="sky-card" style={{ gridColumn: '1 / -1' }}>
          <div className="sky-card__label">
            <Star size={10} /> {constellation.name}, {constellation.latin}
          </div>
          <div className="sky-card__big" style={{ fontSize: 24, marginTop: 4 }}>
            A story, and where to look
          </div>
          <p className="sky-card__meta" style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
            {constellation.story}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              background: 'var(--gold-soft)',
              border: '1px solid color-mix(in srgb, var(--gold) 20%, transparent)',
              borderRadius: 10,
              padding: '10px 12px',
              marginTop: 12,
              fontSize: 11.5,
              color: 'var(--text-2)',
              lineHeight: 1.6,
            }}
          >
            <Eye size={13} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              <strong style={{ color: 'var(--gold)' }}>How to find it:</strong> {constellation.howTo}
            </span>
          </div>
        </div>

        <div className="sky-card">
          <div className="sky-card__label">
            <Sparkles size={10} /> This month · meteor showers
          </div>
          <div className="sky-list">
            {METEOR_SHOWERS.map((s) => (
              <div className="sky-list__row" key={s.name} style={s.name === shower?.name ? { color: 'var(--text)' } : undefined}>
                <span
                  className="planet-dot"
                  style={{
                    background: s.name === shower?.name ? 'var(--gold)' : 'var(--accent)',
                    color: s.name === shower?.name ? 'var(--gold)' : 'var(--accent)',
                  }}
                />
                <span className="sky-list__name">
                  {s.name}
                  {s.name === shower?.name && (
                    <span style={{ fontSize: 8.5, color: 'var(--gold)', marginLeft: 6 }}>PEAKS THIS MONTH</span>
                  )}
                </span>
                <span className="sky-list__detail">{s.peak}</span>
              </div>
            ))}
          </div>
          <div className="sky-card__note">
            {shower
              ? `${shower.name}: ${shower.detail}`
              : 'No major shower peaks this month — a good excuse to watch the quiet sky instead.'}
          </div>
        </div>

        <div className="sky-card">
          <div className="sky-card__label">
            <Eye size={10} /> A few quiet notes
          </div>
          <div className="sky-list">
            <div className="sky-list__row">
              <span className="planet-dot" style={{ background: 'var(--gold)', color: 'var(--gold)' }} />
              <span className="sky-list__name">Give your eyes 20 minutes</span>
              <span className="sky-list__detail">dark adaptation</span>
            </div>
            <div className="sky-list__row">
              <span className="planet-dot" style={{ background: 'var(--accent)', color: 'var(--accent)' }} />
              <span className="sky-list__name">Red light, dim screen</span>
              <span className="sky-list__detail">keep it dark</span>
            </div>
            <div className="sky-list__row">
              <span className="planet-dot" style={{ background: '#7dd3fc', color: '#7dd3fc' }} />
              <span className="sky-list__name">Let your eyes wander</span>
              <span className="sky-list__detail">averted vision</span>
            </div>
            <div className="sky-list__row">
              <span className="planet-dot" style={{ background: '#f0a5c8', color: '#f0a5c8' }} />
              <span className="sky-list__name">Polaris is due north</span>
              <span className="sky-list__detail">find the Dipper</span>
            </div>
          </div>
          <div className="sun-times">
            <span className="sun-time">
              <Sunrise size={11} /> Sunrise {fmtTime(sun.sunrise)}
            </span>
            <span className="sun-time">
              <Sunset size={11} /> Sunset {fmtTime(sun.sunset)}
            </span>
            <span className="sun-time" style={{ color: 'var(--faint)' }}>
              {dayHours}h {dayMinutes}m of daylight
            </span>
          </div>
          <div className="sky-card__note">
            Moon phase and sun times are calculated on your device with standard astronomical
            approximations (sun times use a mid-northern latitude, since Star never asks where you
            are). Constellation months are a general northern-sky guide; the sky is forgiving.
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          fontSize: 10.5,
          color: 'var(--faint)',
          marginTop: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <MoonStar size={11} color="var(--gold)" /> No location requested, no server consulted. Just your
        clock and the sky.
      </div>
    </div>
  )
}
