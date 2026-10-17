export interface MoonInfo {
  phase: number
  illumination: number
  name: string
  shiftPercent: number
  ageDays: number
  emoji: string
}

const SYNODIC = 29.530588853
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) // 2000-01-06 18:14 UTC

export function moonInfo(date = new Date()): MoonInfo {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC
  const phase = age / SYNODIC
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2
  const shiftPercent = phase <= 0.5 ? -120 + 260 * phase : 140 * (1 - (phase - 0.5) * 2)

  let name = 'New Moon'
  let emoji = '🌑'
  const p = phase
  if (p < 0.03 || p >= 0.97) {
    name = 'New Moon'
    emoji = '🌑'
  } else if (p < 0.22) {
    name = 'Waxing Crescent'
    emoji = '🌒'
  } else if (p < 0.28) {
    name = 'First Quarter'
    emoji = '🌓'
  } else if (p < 0.47) {
    name = 'Waxing Gibbous'
    emoji = '🌔'
  } else if (p < 0.53) {
    name = 'Full Moon'
    emoji = '🌕'
  } else if (p < 0.72) {
    name = 'Waning Gibbous'
    emoji = '🌖'
  } else if (p < 0.78) {
    name = 'Last Quarter'
    emoji = '🌗'
  } else {
    name = 'Waning Crescent'
    emoji = '🌘'
  }

  return { phase, illumination, name, shiftPercent, ageDays: age, emoji }
}

export interface Constellation {
  id: string
  name: string
  latin: string
  months: number[] // 1-12 best viewing
  story: string
  howTo: string
  stars: Array<{ x: number; y: number; size: number }>
  lines: Array<[number, number]>
}

export const CONSTELLATIONS: Constellation[] = [
  {
    id: 'orion',
    name: 'Orion',
    latin: 'The Hunter',
    months: [12, 1, 2, 3],
    story:
      'Three stars in a near-perfect line make up Orion’s Belt — the most recognisable pattern in the winter sky. The bright orange star Betelgeuse marks one shoulder; blue-white Rigel anchors a foot.',
    howTo: 'Face south after dark and look for three evenly spaced stars in a row. Betelgeuse glows amber above them.',
    stars: [
      { x: 26, y: 22, size: 3.4 },
      { x: 62, y: 34, size: 2.4 },
      { x: 40, y: 48, size: 2.2 },
      { x: 50, y: 51, size: 2.2 },
      { x: 60, y: 54, size: 2.2 },
      { x: 42, y: 70, size: 2 },
      { x: 68, y: 76, size: 3.8 },
      { x: 22, y: 74, size: 2.6 },
      { x: 78, y: 40, size: 1.6 },
    ],
    lines: [
      [0, 2],
      [0, 1],
      [1, 4],
      [2, 3],
      [3, 4],
      [2, 5],
      [5, 7],
      [4, 6],
      [1, 8],
    ],
  },
  {
    id: 'ursa-major',
    name: 'Ursa Major',
    latin: 'The Great Bear',
    months: [4, 5, 6, 7, 8, 9],
    story:
      'The Big Dipper is only the tail and back of the Great Bear, but it is the part everyone knows. Follow the two stars at the end of the bowl to find Polaris, the North Star.',
    howTo: 'Look north. Find the ladle shape, then trace a line through the two stars at the bowl’s outer edge — it points at Polaris.',
    stars: [
      { x: 20, y: 66, size: 2.6 },
      { x: 30, y: 54, size: 2.2 },
      { x: 44, y: 50, size: 2.4 },
      { x: 55, y: 40, size: 2.2 },
      { x: 64, y: 46, size: 2.6 },
      { x: 74, y: 33, size: 2.4 },
      { x: 84, y: 30, size: 2.8 },
      { x: 56, y: 66, size: 1.4 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [0, 7],
    ],
  },
  {
    id: 'cygnus',
    name: 'Cygnus',
    latin: 'The Swan',
    months: [7, 8, 9, 10],
    story:
      'Also called the Northern Cross, Cygnus flies along the Milky Way. Its brightest star, Deneb, forms one corner of the Summer Triangle with Vega and Altair.',
    howTo: 'Look overhead on a summer or early-autumn evening. The cross lies inside the faint band of the Milky Way.',
    stars: [
      { x: 50, y: 12, size: 3.2 },
      { x: 50, y: 36, size: 2.4 },
      { x: 50, y: 62, size: 2.8 },
      { x: 50, y: 84, size: 2.2 },
      { x: 26, y: 40, size: 2 },
      { x: 74, y: 34, size: 2 },
      { x: 86, y: 20, size: 1.6 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [4, 1],
      [1, 5],
      [5, 6],
    ],
  },
  {
    id: 'cassiopeia',
    name: 'Cassiopeia',
    latin: 'The Queen',
    months: [10, 11, 12, 1, 2],
    story:
      'A bright W (or M, depending on the hour) of five stars, circling Polaris on the opposite side from the Big Dipper. In autumn, it is the easiest way to find the north.',
    howTo: 'Look north and find five bright stars in a zig-zag. When the Dipper is low, Cassiopeia is high.',
    stars: [
      { x: 14, y: 54, size: 2.4 },
      { x: 30, y: 32, size: 2.2 },
      { x: 47, y: 52, size: 2.8 },
      { x: 66, y: 30, size: 2.2 },
      { x: 86, y: 50, size: 2.4 },
      { x: 40, y: 76, size: 1.3 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    id: 'scorpius',
    name: 'Scorpius',
    latin: 'The Scorpion',
    months: [5, 6, 7, 8],
    story:
      'Low in the southern sky on summer nights, Scorpius really does curl like a scorpion. Its red heart, Antares, is a red supergiant roughly 700 times the Sun’s diameter.',
    howTo: 'Find the southern horizon after sunset in summer. Look for a red-orange star with a curved tail of stars trailing below it.',
    stars: [
      { x: 18, y: 24, size: 2 },
      { x: 30, y: 18, size: 2 },
      { x: 42, y: 24, size: 2.2 },
      { x: 50, y: 36, size: 3.8 },
      { x: 56, y: 50, size: 2.2 },
      { x: 62, y: 62, size: 2 },
      { x: 70, y: 72, size: 2.2 },
      { x: 80, y: 66, size: 1.8 },
      { x: 86, y: 52, size: 1.8 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
    ],
  },
]

export interface MeteorShower {
  name: string
  peak: string
  months: number[]
  detail: string
}

export const METEOR_SHOWERS: MeteorShower[] = [
  { name: 'Quadrantids', peak: 'early January', months: [1], detail: 'A short, sharp peak — up to 40 meteors an hour if the Moon cooperates.' },
  { name: 'Lyrids', peak: 'late April', months: [4], detail: 'Quiet but reliable, with about 18 meteors an hour from the Lyra direction.' },
  { name: 'Eta Aquariids', peak: 'early May', months: [5], detail: 'Dust from Halley’s Comet, best seen from the southern hemisphere before dawn.' },
  { name: 'Perseids', peak: 'mid August', months: [8], detail: 'The classic summer shower — warm nights and up to 100 meteors an hour in a dark sky.' },
  { name: 'Orionids', peak: 'late October', months: [10], detail: 'Another gift from Halley’s Comet, radiating from Orion before dawn.' },
  { name: 'Leonids', peak: 'mid November', months: [11], detail: 'Fast meteors with occasional brilliant fireballs.' },
  { name: 'Geminids', peak: 'mid December', months: [12], detail: 'The year’s best shower: slow, bright and up to 120 an hour around the peak.' },
]

export function constellationForMonth(month = new Date().getMonth() + 1): Constellation {
  const match = CONSTELLATIONS.find((c) => c.months.includes(month))
  return match ?? CONSTELLATIONS[0]
}

export function showerForMonth(month = new Date().getMonth() + 1): MeteorShower | undefined {
  return METEOR_SHOWERS.find((s) => s.months.includes(month))
}

export function nextShower(month = new Date().getMonth() + 1): MeteorShower {
  const upcoming = METEOR_SHOWERS.find((s) => s.months.some((m) => m >= month))
  return upcoming ?? METEOR_SHOWERS[0]
}

export function hemisphereNote(date = new Date()): string {
  const month = date.getMonth() + 1
  if ([12, 1, 2].includes(month)) return 'Northern winter · long nights, best seeing'
  if ([3, 4, 5].includes(month)) return 'Northern spring · the Dipper climbs high'
  if ([6, 7, 8].includes(month)) return 'Northern summer · Milky Way season'
  return 'Northern autumn · early sunsets'
}

/**
 * Sunrise / sunset for today, computed with the standard NOAA solar equations.
 * `lon` and `lat` are optional; without a location we fall back to a gentle
 * Rome-ish latitude so the numbers stay plausible rather than authoritative.
 * Nothing leaves the device — this is pure arithmetic.
 */
export function sunTimes(date = new Date(), lat = 41.9, lon = 12.5): { sunrise: Date; sunset: Date; dayLengthMinutes: number } {
  const rad = Math.PI / 180
  const start = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const dayOfYear = Math.floor((start - Date.UTC(date.getFullYear(), 0, 0)) / 86_400_000)
  const lngHour = lon / 15

  const calc = (isSunrise: boolean) => {
    const t = dayOfYear + ((isSunrise ? 6 : 18) - lngHour) / 24
    const m = 0.9856 * t - 3.289
    const l = m + 1.916 * Math.sin(m * rad) + 0.02 * Math.sin(2 * m * rad) + 282.634
    const lNorm = ((l % 360) + 360) % 360
    let ra = (1 / rad) * Math.atan(0.91764 * Math.tan(lNorm * rad))
    ra = ((ra % 360) + 360) % 360
    const lQuadrant = Math.floor(lNorm / 90) * 90
    const raQuadrant = Math.floor(ra / 90) * 90
    ra = (ra + (lQuadrant - raQuadrant)) / 15
    const sinDec = 0.39782 * Math.sin(lNorm * rad)
    const cosDec = Math.cos(Math.asin(sinDec))
    const cosH =
      (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad))
    if (cosH > 1 || cosH < -1) return null
    const h = isSunrise ? 360 - (1 / rad) * Math.acos(cosH) : (1 / rad) * Math.acos(cosH)
    const hHours = h / 15
    const localMeanTime = hHours + ra - 0.06571 * t - 6.622
    let ut = localMeanTime - lngHour
    ut = ((ut % 24) + 24) % 24
    // `ut` is an absolute UTC hour, so this timestamp formats correctly in
    // whatever timezone the device is set to.
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) + ut * 3_600_000)
  }

  const fallback = (hours: number) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    d.setHours(hours, 0, 0, 0)
    return d
  }
  const sunrise = calc(true) ?? fallback(6)
  const sunset = calc(false) ?? fallback(18)
  return {
    sunrise,
    sunset,
    dayLengthMinutes: Math.round((sunset.getTime() - sunrise.getTime()) / 60_000),
  }
}
