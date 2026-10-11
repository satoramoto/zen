/**
 * The blooms' geometry, palettes and motion, shared by Blooms.svelte (which draws them), Bloom.svelte
 * (one soft glow, also DisplayArt's) and the worst-spot contrast test (contrast.test.ts), so the
 * test checks exactly what is drawn.
 */

/** Which hues the blooms take (the owner's taste call; Blooms.stories.ts shows each). */
export type BloomPalette = 'aurora' | 'parts' | 'section'
/** How far the blooms swell and drift while the band plays. */
export type BloomMotion = 'calm' | 'lively'
/** A section family: its hue is the section's own (--intro, --main, …). */
export type BloomSection = 'intro' | 'main' | 'ending' | 'brk' | 'fill'

/**
 * One bloom: its centre and radius as fractions of the box (x and r of its width, y of its height),
 * its strength (a fraction of the theme's --bloom-peak), and its drift (a fraction of its own size)
 * and phase (a fraction of a breath) so no two move together.
 */
export type BloomSpot = { x: number; y: number; r: number; weight: number; dx: number; dy: number; phase: number }

/**
 * The spots, in palette order. The first is the anchor: the top-right quadrant, where DisplayArt's
 * violet glow sat, in the accent hue. The others sit low and wide, far enough apart that at most two
 * overlap and never at their cores; the readouts in the display's middle third get the faintest light.
 */
export const SPOTS: readonly BloomSpot[] = [
  { x: 0.8, y: 0.18, r: 0.36, weight: 1, dx: -0.04, dy: 0.03, phase: 0 },
  { x: 0.08, y: 0.74, r: 0.38, weight: 0.95, dx: 0.05, dy: -0.03, phase: 0.31 },
  { x: 0.52, y: 1.04, r: 0.34, weight: 0.9, dx: -0.03, dy: -0.04, phase: 0.58 },
  { x: 0.2, y: 0.02, r: 0.28, weight: 0.8, dx: 0.04, dy: 0.04, phase: 0.17 },
  { x: 0.98, y: 0.9, r: 0.26, weight: 0.8, dx: -0.04, dy: -0.03, phase: 0.79 },
]

/**
 * The falloff from a bloom's centre to its edge: [distance as a fraction of the radius, alpha as a
 * fraction of the bloom's strength]. Eased, so the edge never shows.
 */
export const FALLOFF: readonly (readonly [number, number])[] = [
  [0, 1],
  [0.3, 0.88],
  [0.55, 0.58],
  [0.8, 0.2],
  [1, 0],
]

/**
 * The hue each spot takes, per palette: the bloom roles (tokens/blooms.css), which are the theme's
 * accent, part and section hues (in light, their bright versions).
 */
export function hues(palette: BloomPalette, section: BloomSection = 'main'): string[] {
  if (palette === 'parts') return ['--bloom-a', '--bloom-r1', '--bloom-r2', '--bloom-l', '--bloom-r3']
  if (palette === 'section') return ['--bloom-a', `--bloom-${section}`, `--bloom-${section}`, `--bloom-${section}`]
  // Aurora keeps to the hues that glow plainly on black within AA (blue- and red-led, no green):
  // the accent violet, blue, magenta and plum.
  return ['--bloom-a', '--bloom-r1', '--bloom-r2', '--bloom-brk']
}

/** The swell (scale) and the drift (a multiple of each spot's dx, dy) at the top of a breath. */
export const MOTION: Record<BloomMotion, { swell: number; drift: number }> = {
  calm: { swell: 0.14, drift: 2.5 },
  lively: { swell: 0.22, drift: 3.5 },
}

/**
 * The opacity of a bloom at the bottom of a breath (it reaches 1 at the top). Deep enough that a
 * breath shows at a glance on a real screen, not only side by side in a story.
 */
export const EXHALE = 0.5
/** The whole backdrop's opacity when the band is stopped: still and calm. */
export const REST = 0.7
/** The backdrop's opacity while playing, at level 0 and at level 1. */
export const PLAY_QUIET = 0.85
export const PLAY_LOUD = 1

/** One breath, in ms: `bars` bars at `bpm`. */
export function breathMs(bpm: number, beatsPerBar: number, bars: number): number {
  const b = Math.max(20, bpm || 120)
  return (Math.max(1, bars) * Math.max(1, beatsPerBar || 4) * 60000) / b
}

/** Where a spot is in its breath at clock position `beat` (beats), as ms into the breath. */
export function phaseMs(beat: number, beatsPerBreath: number, breath: number, phase: number): number {
  const f = (Math.max(0, beat) / Math.max(1, beatsPerBreath) + phase) % 1
  return f * breath
}

/** A phase drift no bigger than this fraction of an animation's length is left alone. */
export const DRIFT = 0.02
/** The slowest and fastest a breath runs while it eases back onto the clock. */
export const RATE_MIN = 0.5
export const RATE_MAX = 1.5

/**
 * The signed phase error of an animation `length` ms long that is at `now` ms and should be at
 * `want` ms, the short way round the loop: positive when it lags, in [-length / 2, length / 2).
 */
export function phaseError(now: number, want: number, length: number): number {
  const L = Math.max(1, length)
  return ((((want - now) % L) + L * 1.5) % L) - L / 2
}

/**
 * The playback rate that eases an animation back onto the clock instead of snapping it: the error
 * closes over about one `breath` (ms), since the animation gains `rate - 1` ms on the clock per ms.
 * Asked again at each sync, the remaining error shrinks smoothly to nothing. A drift within DRIFT of
 * the length is left alone (rate 1); the rate stays within RATE_MIN..RATE_MAX, so a breath never
 * visibly races, stops or runs backwards.
 */
export function relockRate(now: number, want: number, length: number, breath: number): number {
  const e = phaseError(now, want, length)
  if (Math.abs(e) <= DRIFT * length) return 1
  return Math.min(RATE_MAX, Math.max(RATE_MIN, 1 + e / Math.max(1, breath)))
}

/** The overall level (0..1) from the master RMS (linear): -42 dBFS is 0, -9 dBFS is 1. */
export function levelOf(rms: readonly number[] | undefined): number {
  const x = Math.max(0, ...(rms ?? [0]))
  if (x <= 0) return 0
  const db = 20 * Math.log10(x)
  return Math.min(1, Math.max(0, (db + 42) / 33))
}

/** The CSS radial gradient of one bloom in `hue` (a role name), at `weight` of --bloom-peak. */
export function gradient(hue: string, weight: number): string {
  const stops = FALLOFF.map(
    ([d, a]) => `color-mix(in srgb, var(${hue}) calc(var(--bloom-peak) * ${+(weight * a).toFixed(3)}), transparent) ${d * 100}%`,
  )
  return `radial-gradient(closest-side, ${stops.join(', ')})`
}

/** A bloom's alpha (a fraction of --bloom-peak) at distance `d` from its centre, in radii. */
export function alphaAt(d: number, weight: number): number {
  if (d >= 1) return 0
  for (let i = 1; i < FALLOFF.length; i++) {
    const [d1, a1] = FALLOFF[i]
    const [d0, a0] = FALLOFF[i - 1]
    if (d <= d1) return weight * (a0 + ((d - d0) / (d1 - d0)) * (a1 - a0))
  }
  return 0
}
