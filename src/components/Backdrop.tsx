import { useMemo } from 'react'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function Backdrop() {
  const stars = useMemo(() => {
    const rand = seeded(20261017)
    return Array.from({ length: 110 }, (_, i) => {
      const bright = rand() > 0.93
      return {
        id: i,
        x: rand() * 1600,
        y: rand() * 1000,
        r: bright ? 1.5 + rand() * 0.9 : 0.35 + rand() * 0.95,
        o: 0.18 + rand() * 0.7,
        dur: 4 + rand() * 7,
        delay: rand() * 8,
      }
    })
  }, [])

  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__blob backdrop__blob--one" />
      <div className="backdrop__blob backdrop__blob--two" />
      <div className="backdrop__blob backdrop__blob--three" />
      <svg
        className="backdrop__field"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
      >
        {stars.map((s) => (
          <circle
            key={s.id}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#fff7e2"
            opacity={s.o}
            style={
              {
                '--dur': `${s.dur}s`,
                '--delay': `-${s.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
        {/* two hand-drawn sparkles for depth */}
        <g fill="#ffe9b5" opacity="0.55">
          <path d="M1310 148c.9 5 4 8.1 9 9-5 .9-8.1 4-9 9-.9-5-4-8.1-9-9 5-.9 8.1-4 9-9Z" />
          <path d="M272 742c.65 3.6 2.9 5.85 6.5 6.5-3.6.65-5.85 2.9-6.5 6.5-.65-3.6-2.9-5.85-6.5-6.5 3.6-.65 5.85-2.9 6.5-6.5Z" />
        </g>
      </svg>
      <div className="backdrop__grain" />
    </div>
  )
}
