/**
 * The blooms' motion: compositor animations that breathe only while playing, phase-locked to the
 * clock, sized by the tempo, still under reduced motion; and the pure helpers in blooms.ts. jsdom has
 * no Web Animations, so `Element.animate` is a fake that records what the blooms ask for.
 */
import { cleanup, render } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Blooms from './Blooms.svelte'
import {
  DRIFT,
  PLAY_LOUD,
  PLAY_QUIET,
  RATE_MAX,
  RATE_MIN,
  REST,
  SPOTS,
  alphaAt,
  breathMs,
  gradient,
  hues,
  levelOf,
  phaseError,
  phaseMs,
  relockRate,
} from './blooms'

type Fake = {
  keyframes: Keyframe[]
  duration: number
  currentTime: number
  playbackRate: number
  playState: 'running' | 'paused' | 'idle'
  play: () => void
  pause: () => void
  cancel: () => void
  effect: { getTiming: () => { duration: number }; updateTiming: (t: { duration: number }) => void }
}

let fakes: Fake[] = []
const realAnimate = Element.prototype.animate
const realMatchMedia = window.matchMedia

function fakeAnimate(this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation {
  const a: Fake = {
    keyframes,
    duration: Number(options.duration),
    currentTime: 0,
    playbackRate: 1,
    playState: 'running',
    play: () => (a.playState = 'running'),
    pause: () => (a.playState = 'paused'),
    cancel: () => (a.playState = 'idle'),
    effect: {
      getTiming: () => ({ duration: a.duration }),
      updateTiming: (t) => (a.duration = t.duration),
    },
  }
  fakes.push(a)
  return a as unknown as Animation
}

function reducedMotion(on: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: on && q.includes('reduce'),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
}

beforeEach(() => {
  fakes = []
  Element.prototype.animate = fakeAnimate as unknown as typeof Element.prototype.animate
  reducedMotion(false)
})

afterEach(() => {
  cleanup()
  Element.prototype.animate = realAnimate
  window.matchMedia = realMatchMedia
  vi.useRealTimers()
})

const live = () => fakes.filter((a) => a.playState !== 'idle')

describe('Blooms', () => {
  it('draws one bloom per hue of the palette, hidden from assistive tech', () => {
    const { container } = render(Blooms, { palette: 'parts' })
    const root = container.querySelector('.blooms')
    expect(root?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelectorAll('.swell')).toHaveLength(5)
    expect((container.querySelector('.swell') as HTMLElement).style.background).toContain('--bloom-a')
  })

  it('holds still while stopped, and dims to the rest opacity', async () => {
    const { container } = render(Blooms, { playing: false })
    await tick()
    expect(live().length).toBe(8)
    expect(live().every((a) => a.playState === 'paused')).toBe(true)
    expect(Number((container.querySelector('.blooms') as HTMLElement).style.opacity)).toBeCloseTo(REST)
  })

  it('breathes while playing: one breath per 4 bars at the tempo, locked to the clock', async () => {
    const beat = vi.fn(() => 8)
    render(Blooms, { playing: true, bpm: 120, beatsPerBar: 4, barsPerBreath: 4, beat })
    await tick()
    const [swell, drift] = live()
    expect(swell.playState).toBe('running')
    // 4 bars of 4 at 120 BPM: 8 s; the drift spans two breaths.
    expect(swell.duration).toBe(8000)
    expect(drift.duration).toBe(16000)
    // Beat 8 of a 16-beat breath, plus the first spot's phase (0): half way.
    expect(swell.currentTime).toBeCloseTo(4000)
    expect(beat).toHaveBeenCalled()
    // Only transform and opacity animate.
    const props = new Set(live().flatMap((a) => a.keyframes.flatMap((k) => Object.keys(k))))
    expect([...props].sort()).toEqual(['easing', 'opacity', 'transform'])
  })

  it('breathes deep enough to see: a plain swell, fade and drift in every motion', async () => {
    // The owner's bug: a breath of 0.82 to 1 opacity and a 6% swell was invisible on a real screen.
    for (const motion of ['calm', 'lively'] as const) {
      fakes = []
      render(Blooms, { motion, playing: true, beat: () => 0 })
      await tick()
      const [swell, drift] = live()
      const scale = (k: Keyframe) => Number(/scale\(([\d.]+)\)/.exec(String(k.transform))?.[1])
      expect(scale(swell.keyframes[1]) - scale(swell.keyframes[0])).toBeGreaterThanOrEqual(0.12)
      expect(Number(swell.keyframes[1].opacity) - Number(swell.keyframes[0].opacity)).toBeGreaterThanOrEqual(0.4)
      // The drift: at least 8% of the bloom's own size, along at least one axis.
      const moved = /translate\((-?[\d.]+)%, (-?[\d.]+)%\)/.exec(String(drift.keyframes[1].transform))
      expect(Math.max(Math.abs(Number(moved?.[1])), Math.abs(Number(moved?.[2])))).toBeGreaterThanOrEqual(8)
      cleanup()
    }
  })

  it('re-locks when the tempo changes, and pauses again on stop', async () => {
    const view = render(Blooms, { playing: true, bpm: 120, beat: () => 0 })
    await tick()
    await view.rerender({ playing: true, bpm: 60, beat: () => 0 })
    await tick()
    expect(live()[0].duration).toBe(16000)
    await view.rerender({ playing: false, bpm: 60, beat: () => 0 })
    await tick()
    expect(live().every((a) => a.playState === 'paused')).toBe(true)
  })

  it('reads the clock only when it syncs, every few seconds', async () => {
    vi.useFakeTimers()
    const beat = vi.fn(() => 0)
    render(Blooms, { playing: true, beat })
    await tick()
    const first = beat.mock.calls.length
    vi.advanceTimersByTime(1000)
    expect(beat.mock.calls.length).toBe(first)
    vi.advanceTimersByTime(4000)
    expect(beat.mock.calls.length).toBe(first + 1)
  })

  it('eases back onto the clock after it jumps (a section change, a fill), never snapping', async () => {
    vi.useFakeTimers()
    let pos = 0
    render(Blooms, { playing: true, bpm: 120, beat: () => pos })
    await tick()
    const swell = live()[0]
    expect(swell.currentTime).toBe(0)
    // The clock jumps 4 beats on (a quarter breath) while the animation stands where it was.
    pos = 4
    vi.advanceTimersByTime(4000)
    expect(swell.currentTime).toBe(0)
    expect(swell.playbackRate).toBeGreaterThan(1)
    expect(swell.playbackRate).toBeLessThanOrEqual(RATE_MAX)
    // Caught up: back to its own pace.
    swell.currentTime = 2000
    vi.advanceTimersByTime(4000)
    expect(swell.playbackRate).toBe(1)
  })

  it('keeps its place in the breath across a tempo change, and eases on', async () => {
    let pos = 0
    const view = render(Blooms, { playing: true, bpm: 120, beat: () => pos })
    await tick()
    const swell = live()[0]
    swell.currentTime = 2000 // a quarter of an 8 s breath
    pos = 4
    await view.rerender({ playing: true, bpm: 60, beat: () => pos })
    await tick()
    expect(swell.playState).toBe('running')
    expect(swell.duration).toBe(16000)
    expect(swell.currentTime).toBeCloseTo(4000)
    expect(swell.playbackRate).toBe(1)
  })

  it('keeps breathing through a section change: the same animations, not restarted', async () => {
    for (const palette of ['aurora', 'section'] as const) {
      fakes = []
      const view = render(Blooms, { palette, section: 'main', playing: true, beat: () => 0 })
      await tick()
      const before = live()
      before[0].currentTime = 3000
      await view.rerender({ palette, section: 'ending', playing: true, beat: () => 8 })
      await tick()
      expect(fakes).toHaveLength(before.length)
      expect(live()).toEqual(before)
      expect(before[0].currentTime).toBe(3000)
      cleanup()
    }
  })

  it('moves nothing under prefers-reduced-motion', async () => {
    reducedMotion(true)
    const { container } = render(Blooms, { playing: true, beat: () => 0 })
    await tick()
    expect(fakes).toHaveLength(0)
    expect(Number((container.querySelector('.blooms') as HTMLElement).style.opacity)).toBeCloseTo(REST)
  })

  it('lifts with the level while playing', async () => {
    const view = render(Blooms, { playing: true, level: 0, beat: () => 0 })
    await tick()
    const root = view.container.querySelector('.blooms') as HTMLElement
    expect(Number(root.style.opacity)).toBeCloseTo(PLAY_QUIET)
    // A change inside half a second waits (at most two opacity changes a second).
    await view.rerender({ playing: true, level: 1, beat: () => 0 })
    await tick()
    expect(Number(root.style.opacity)).toBeCloseTo(PLAY_QUIET)
    await new Promise((r) => setTimeout(r, 550))
    await tick()
    expect(Number(root.style.opacity)).toBeCloseTo(PLAY_LOUD)
  })
})

describe('blooms.ts', () => {
  it('times a breath from the tempo and metre', () => {
    expect(breathMs(120, 4, 4)).toBe(8000)
    expect(breathMs(90, 3, 2)).toBe(4000)
  })

  it('puts a spot in its breath by the clock and its phase', () => {
    expect(phaseMs(0, 16, 8000, 0)).toBe(0)
    expect(phaseMs(20, 16, 8000, 0)).toBe(2000)
    expect(phaseMs(0, 16, 8000, 0.25)).toBe(2000)
  })

  it('measures a phase error the short way round the loop', () => {
    expect(phaseError(1000, 3000, 8000)).toBe(2000)
    expect(phaseError(3000, 1000, 8000)).toBe(-2000)
    expect(phaseError(7500, 500, 8000)).toBe(1000)
    expect(phaseError(500, 7500, 8000)).toBe(-1000)
  })

  it('leaves a small drift alone', () => {
    expect(relockRate(0, DRIFT * 8000, 8000, 8000)).toBe(1)
    expect(relockRate(100, 0, 8000, 8000)).toBe(1)
    expect(relockRate(0, 0, 8000, 8000)).toBe(1)
  })

  it('closes a phase error over about a breath, without a jump', () => {
    // Re-asked every 4 s, as the blooms sync, on an 8 s breath, a quarter-breath behind: the
    // animation runs a little fast, its time only ever moving forwards, smoothly.
    const breath = 8000
    const step = 4000
    let now = 0
    let want = 2000
    const errors: number[] = []
    for (let t = 0; t < 4; t++) {
      const rate = relockRate(now, want, breath, breath)
      expect(rate).toBeGreaterThanOrEqual(RATE_MIN)
      expect(rate).toBeLessThanOrEqual(RATE_MAX)
      now = (now + rate * step) % breath
      want = (want + step) % breath
      errors.push(Math.abs(phaseError(now, want, breath)))
    }
    // After one breath (two syncs) most of the error is gone; after two it is within the drift.
    expect(errors[1]).toBeLessThanOrEqual(2000 / 4)
    expect(errors[3]).toBeLessThanOrEqual(DRIFT * breath)
    // Ahead of the clock it slows down instead, but never stops or runs backwards.
    expect(relockRate(2000, 0, breath, breath)).toBeLessThan(1)
    expect(relockRate(4000, 0, breath, breath)).toBeGreaterThanOrEqual(RATE_MIN)
    expect(relockRate(0, 3999, breath, breath)).toBeLessThanOrEqual(RATE_MAX)
  })

  it('maps the master RMS to a level', () => {
    expect(levelOf(undefined)).toBe(0)
    expect(levelOf([0, 0])).toBe(0)
    expect(levelOf([1, 0.5])).toBe(1)
    expect(levelOf([0.05, 0.02])).toBeGreaterThan(0.3)
    expect(levelOf([0.05, 0.02])).toBeLessThan(0.6)
  })

  it('fades a bloom to nothing at its edge', () => {
    expect(alphaAt(0, 1)).toBe(1)
    expect(alphaAt(1, 1)).toBe(0)
    expect(alphaAt(0.5, 0.5)).toBeCloseTo(0.32)
    expect(alphaAt(0.425, 1)).toBeCloseTo(0.73)
    expect(gradient('--bloom-a', 1)).toMatch(/^radial-gradient\(closest-side, color-mix\(in srgb, var\(--bloom-a\)/)
  })

  it('anchors the accent at top right, in every palette', () => {
    for (const p of ['aurora', 'parts', 'section'] as const) expect(hues(p)[0]).toBe('--bloom-a')
    expect(SPOTS[0].x).toBeGreaterThan(0.5)
    expect(SPOTS[0].y).toBeLessThan(0.5)
    expect(hues('section', 'ending').slice(1)).toEqual(['--bloom-ending', '--bloom-ending', '--bloom-ending'])
  })
})
