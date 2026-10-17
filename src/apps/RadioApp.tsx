import { useEffect, useRef, useState } from 'react'
import { Moon, Pause, Play, Radio, Volume2, VolumeX, Waves } from 'lucide-react'
import { useBrowser } from '../store/browser'

type StationId = 'deep' | 'drift' | 'train'

interface Station {
  id: StationId
  name: string
  desc: string
  colors: [string, string]
}

const STATIONS: Station[] = [
  {
    id: 'deep',
    name: 'Deep Field',
    desc: 'Slow minor pads for long thoughts. Low, warm, barely moving — the room gets a little bigger.',
    colors: ['#ffcf6b', '#ff8a5c'],
  },
  {
    id: 'drift',
    name: 'Ion Drift',
    desc: 'Airy overtones and a patient shimmer. Good for staring out of windows and returning emails slowly.',
    colors: ['#7dd3fc', '#a78bfa'],
  },
  {
    id: 'train',
    name: 'Night Train',
    desc: 'A soft pulse under a low pad. Somewhere between three in the morning and home.',
    colors: ['#b590ff', '#f07bc0'],
  },
]

const BARS = 30

function makeImpulse(ctx: AudioContext, seconds = 3.4, decay = 2.6): AudioBuffer {
  const rate = ctx.sampleRate
  const length = Math.floor(rate * seconds)
  const buffer = ctx.createBuffer(2, length, rate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }
  return buffer
}

interface Graph {
  out: GainNode
  stop: () => void
}

function buildStation(ctx: AudioContext, id: StationId, destination: AudioNode): Graph {
  const out = ctx.createGain()
  out.gain.value = 0.9
  out.connect(destination)

  const sources: OscillatorNode[] = []
  const extras: AudioNode[] = [out]

  const reverb = ctx.createConvolver()
  reverb.buffer = makeImpulse(ctx)
  const wet = ctx.createGain()
  wet.gain.value = id === 'drift' ? 0.55 : id === 'deep' ? 0.4 : 0.3
  reverb.connect(wet)
  wet.connect(out)
  extras.push(reverb, wet)

  const send = ctx.createGain()
  send.gain.value = 0.55
  send.connect(reverb)
  extras.push(send)

  const dry = ctx.createGain()
  dry.gain.value = 1
  dry.connect(out)
  extras.push(dry)

  const voice = (
    type: OscillatorType,
    freq: number,
    gainValue: number,
    target: AudioNode,
    detune = 0,
  ) => {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    osc.detune.value = detune
    const gain = ctx.createGain()
    gain.gain.value = gainValue
    osc.connect(gain)
    gain.connect(target)
    osc.start()
    sources.push(osc)
    extras.push(gain)
    return { osc, gain }
  }

  const lfo = (rate: number, depth: number, param: AudioParam, type: OscillatorType = 'sine') => {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = rate
    const gain = ctx.createGain()
    gain.gain.value = depth
    osc.connect(gain)
    gain.connect(param)
    osc.start()
    sources.push(osc)
    extras.push(gain)
  }

  const noise = (gainValue: number, filterType: BiquadFilterType, frequency: number, q = 0.8) => {
    const length = Math.floor(ctx.sampleRate * 2)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.value = frequency
    filter.Q.value = q
    const gain = ctx.createGain()
    gain.gain.value = gainValue
    src.connect(filter)
    filter.connect(gain)
    gain.connect(dry)
    gain.connect(send)
    src.start()
    sources.push(src as unknown as OscillatorNode)
    extras.push(filter, gain)
    return { src, filter, gain }
  }

  if (id === 'deep') {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 720
    filter.Q.value = 0.6
    filter.connect(dry)
    filter.connect(send)
    extras.push(filter)

    const breath = ctx.createGain()
    breath.gain.value = 0.8
    breath.connect(filter)
    extras.push(breath)

    ;[
      { type: 'sine' as OscillatorType, freq: 55, vol: 0.16, det: 0 },
      { type: 'sine' as OscillatorType, freq: 110, vol: 0.1, det: -4 },
      { type: 'triangle' as OscillatorType, freq: 164.81, vol: 0.055, det: 3 },
      { type: 'sine' as OscillatorType, freq: 220, vol: 0.045, det: -2 },
      { type: 'sine' as OscillatorType, freq: 329.63, vol: 0.018, det: 5 },
    ].forEach((v) => voice(v.type, v.freq, v.vol, breath, v.det))

    lfo(0.035, 240, filter.frequency)
    lfo(0.05, 0.22, breath.gain)
    noise(0.012, 'lowpass', 420, 0.5)
  }

  if (id === 'drift') {
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 980
    filter.Q.value = 1.1
    filter.connect(dry)
    filter.connect(send)
    extras.push(filter)

    const tremolo = ctx.createGain()
    tremolo.gain.value = 0.82
    tremolo.connect(filter)
    extras.push(tremolo)

    ;[
      { type: 'triangle' as OscillatorType, freq: 87.31, vol: 0.075, det: 0 },
      { type: 'triangle' as OscillatorType, freq: 174.61, vol: 0.06, det: -5 },
      { type: 'sine' as OscillatorType, freq: 220, vol: 0.05, det: 4 },
      { type: 'sine' as OscillatorType, freq: 261.63, vol: 0.04, det: -3 },
      { type: 'sine' as OscillatorType, freq: 329.63, vol: 0.032, det: 6 },
    ].forEach((v) => voice(v.type, v.freq, v.vol, tremolo, v.det))

    const shimmer = ctx.createGain()
    shimmer.gain.value = 0.012
    shimmer.connect(send)
    shimmer.connect(dry)
    extras.push(shimmer)
    voice('sine', 1046.5, 0.5, shimmer, 2)
    voice('sine', 1396.9, 0.32, shimmer, -3)
    voice('sine', 2093, 0.16, shimmer, 4)

    lfo(0.07, 260, filter.frequency)
    lfo(0.11, 0.16, tremolo.gain)
    lfo(0.06, 0.008, shimmer.gain)
    noise(0.007, 'highpass', 2600, 0.6)
  }

  if (id === 'train') {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 640
    filter.Q.value = 1.4
    filter.connect(dry)
    filter.connect(send)
    extras.push(filter)

    const pad = ctx.createGain()
    pad.gain.value = 0.85
    pad.connect(filter)
    extras.push(pad)

    ;[
      { type: 'triangle' as OscillatorType, freq: 110, vol: 0.055, det: -2 },
      { type: 'triangle' as OscillatorType, freq: 164.81, vol: 0.045, det: 3 },
      { type: 'sine' as OscillatorType, freq: 220, vol: 0.036, det: -4 },
      { type: 'sine' as OscillatorType, freq: 261.63, vol: 0.028, det: 2 },
    ].forEach((v) => voice(v.type, v.freq, v.vol, pad, v.det))

    // gentle low pulse
    const pulse = ctx.createGain()
    pulse.gain.value = 0.9
    pulse.connect(dry)
    extras.push(pulse)
    voice('sine', 55, 0.17, pulse, 0)
    const pulseLfo = ctx.createGain()
    pulseLfo.gain.value = 0.5
    const pulseOsc = ctx.createOscillator()
    pulseOsc.type = 'sine'
    pulseOsc.frequency.value = 0.42
    pulseOsc.connect(pulseLfo)
    pulseLfo.connect(pulse.gain)
    pulseOsc.start()
    sources.push(pulseOsc)
    extras.push(pulseLfo)

    // ambient rail noise with a slow sweep
    const rail = noise(0.02, 'bandpass', 900, 0.9)
    lfo(0.045, 220, rail.filter.frequency)
    lfo(0.03, 120, filter.frequency)

    // a little echo for space
    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.44
    const feedback = ctx.createGain()
    feedback.gain.value = 0.26
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(dry)
    extras.push(delay, feedback)
    pad.connect(delay)
  }

  return {
    out,
    stop: () => {
      const now = ctx.currentTime
      out.gain.cancelScheduledValues(now)
      out.gain.setTargetAtTime(0, now, 0.08)
      window.setTimeout(() => {
        for (const source of sources) {
          try {
            source.stop()
          } catch {
            /* already stopped */
          }
        }
        for (const node of extras) {
          try {
            node.disconnect()
          } catch {
            /* already disconnected */
          }
        }
        try {
          send.disconnect()
          dry.disconnect()
          wet.disconnect()
          reverb.disconnect()
        } catch {
          /* noop */
        }
      }, 500)
    },
  }
}

export function RadioApp() {
  const { toast } = useBrowser()
  const [stationId, setStationId] = useState<StationId>('deep')
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.6)
  const [sleepMinutes, setSleepMinutes] = useState(0)
  const [remaining, setRemaining] = useState(0)

  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const barsRef = useRef<Array<HTMLSpanElement | null>>([])
  const rafRef = useRef(0)
  const playingRef = useRef(false)
  const volumeRef = useRef(volume)
  playingRef.current = playing
  volumeRef.current = volume

  const station = STATIONS.find((s) => s.id === stationId) ?? STATIONS[0]

  const ensureAudio = () => {
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      const ctx = new Ctor()
      const master = ctx.createGain()
      master.gain.value = 0
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.82
      master.connect(analyser)
      analyser.connect(ctx.destination)
      ctxRef.current = ctx
      masterRef.current = master
      analyserRef.current = analyser
    }
    return ctxRef.current
  }

  const setMaster = (value: number) => {
    const ctx = ctxRef.current
    const master = masterRef.current
    if (!ctx || !master) return
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(value, ctx.currentTime, 0.12)
  }

  const startStation = (id: StationId) => {
    const ctx = ensureAudio()
    if (!ctx) {
      toast('This browser does not support the Web Audio API', { icon: 'info' })
      return
    }
    void ctx.resume()
    if (graphRef.current) {
      graphRef.current.stop()
      graphRef.current = null
    }
    graphRef.current = buildStation(ctx, id, masterRef.current!)
    setMaster(volumeRef.current * 0.32)
  }

  const pause = () => {
    setPlaying(false)
    playingRef.current = false
    setMaster(0)
  }

  const play = () => {
    const ctx = ensureAudio()
    if (!ctx) return
    void ctx.resume()
    if (!graphRef.current) {
      graphRef.current = buildStation(ctx, stationId, masterRef.current!)
    }
    setMaster(volumeRef.current * 0.32)
    setPlaying(true)
    playingRef.current = true
  }

  const chooseStation = (id: StationId) => {
    setStationId(id)
    if (playingRef.current) startStation(id)
  }

  // Volume changes
  useEffect(() => {
    if (playingRef.current) setMaster(volume * 0.32)
  }, [volume])

  // Visualizer
  useEffect(() => {
    const animate = () => {
      const analyser = analyserRef.current
      const bars = barsRef.current
      if (analyser && playingRef.current) {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        const step = Math.floor(data.length / BARS)
        for (let i = 0; i < BARS; i++) {
          let sum = 0
          for (let j = 0; j < step; j++) sum += data[i * step + j]
          const avg = sum / step / 255
          const height = Math.max(3, Math.pow(avg, 1.35) * 46)
          const bar = bars[i]
          if (bar) {
            bar.style.height = `${height}px`
            bar.style.opacity = '0.85'
          }
        }
      } else {
        const t = performance.now() / 1000
        for (let i = 0; i < BARS; i++) {
          const bar = bars[i]
          if (!bar) continue
          const idle = 4 + Math.sin(t * 0.9 + i * 0.55) * 2 + Math.sin(t * 0.37 + i * 1.7) * 1.6
          bar.style.height = `${Math.max(3, idle)}px`
          bar.style.opacity = '0.35'
        }
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // sleep timer
  useEffect(() => {
    if (!playing || sleepMinutes === 0) {
      setRemaining(0)
      return
    }
    const end = Date.now() + sleepMinutes * 60_000
    setRemaining(sleepMinutes * 60)
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        window.clearInterval(id)
        setPlaying(false)
        playingRef.current = false
        setMaster(0)
        toast('Focus Radio faded out — sleep timer reached', { icon: 'moon' })
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [playing, sleepMinutes, toast])

  // cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      graphRef.current?.stop()
      const ctx = ctxRef.current
      window.setTimeout(() => {
        if (ctx && ctx.state !== 'closed') void ctx.close()
      }, 550)
    }
  }, [])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="radio-page">
      <div className="radio-head">
        <div className="page__eyebrow">
          <Waves size={11} /> generated live · no stream
        </div>
        <h1 className="radio-head__title">
          Focus <em>Radio</em>
        </h1>
        <p className="radio-head__sub">
          Three endless ambient stations, synthesised in your browser with the Web Audio API. No
          downloads, no buffering, no data.
        </p>
      </div>

      <div
        className="radio-now"
        style={{ '--station-a': station.colors[0], '--station-b': station.colors[1] } as React.CSSProperties}
      >
        <div className="radio-now__info">
          <div className="radio-now__eyebrow">
            {playing ? (
              <>
                <span className="radio-now__live" /> on air · generated now
              </>
            ) : (
              <>
                <Radio size={9} /> tuned out
              </>
            )}
          </div>
          <div className="radio-now__name">{station.name}</div>
          <div className="radio-now__desc">{station.desc}</div>
        </div>

        <div className="radio-controls">
          <div className="radio-volume">
            {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              aria-label="Volume"
            />
          </div>
          <button
            className="radio-play"
            onClick={playing ? pause : play}
            aria-label={playing ? 'Pause radio' : 'Play radio'}
          >
            {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: 3 }} />}
          </button>
        </div>

        <div className="visualizer" aria-hidden="true">
          {Array.from({ length: BARS }, (_, i) => (
            <span
              key={i}
              ref={(el) => {
                barsRef.current[i] = el
              }}
            />
          ))}
        </div>
      </div>

      <div className="station-grid">
        {STATIONS.map((s) => (
          <button
            key={s.id}
            className="station-card"
            data-active={stationId === s.id}
            style={{ '--sa': s.colors[0], '--sb': s.colors[1] } as React.CSSProperties}
            onClick={() => chooseStation(s.id)}
          >
            <span className="station-card__swatch">
              <Waves size={13} />
            </span>
            <span className="station-card__name">{s.name}</span>
            <span className="station-card__desc">{s.desc}</span>
            {stationId === s.id && playing && (
              <span className="station-card__eq">
                <i />
                <i />
                <i />
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          marginTop: 18,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--faint)' }}>
          <Moon size={12} /> Sleep timer
        </span>
        <select
          className="select"
          value={sleepMinutes}
          onChange={(e) => setSleepMinutes(Number(e.target.value))}
        >
          <option value={0}>Off</option>
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
        </select>
        {playing && sleepMinutes > 0 && (
          <span style={{ fontSize: 10.5, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>
            {minutes}:{String(seconds).padStart(2, '0')} left
          </span>
        )}
        <span style={{ fontSize: 10, color: 'var(--faint)', display: 'inline-flex', gap: 5, alignItems: 'center' }}>
          <Waves size={10} /> Keep the volume low — this one is meant to sit underneath your day.
        </span>
      </div>

      <p className="radio-note">
        Every note here is an oscillator. Every texture is filtered noise. Nothing is streamed,
        recorded or uploaded — closing the tab stops the music entirely.
      </p>
    </div>
  )
}
