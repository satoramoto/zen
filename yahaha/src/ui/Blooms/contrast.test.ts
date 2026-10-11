/**
 * Text contrast on the blooms' worst spot, in dark and light: every text role drawn on the ground
 * must still reach WCAG AA (4.5:1) where the blooms make the ground brightest (dark) or darkest
 * (light). It samples the backdrop over a 1440 × 900 screen, with every palette, each bloom at the
 * top of its breath (full opacity) and, conservatively, at whichever place along its drift path (sampled
 * densely, rest and swollen) is strongest at that point, composited over the ground as the browser does (sRGB "over").
 * The same geometry and falloff as Blooms draws (blooms.ts); the strength from tokens/blooms.css.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MOTION, SPOTS, alphaAt, hues, type BloomPalette, type BloomSection } from './blooms'

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
const palette = read('../tokens/palette.css')
const dark = read('../tokens/dark.css')
const light = read('../tokens/light.css')
const blooms = read('../tokens/blooms.css')

/** Every text role drawn on the ground (tokens/contrast.test.ts, its rows on --g). */
const FILLS = ['--r1', '--r2', '--r3', '--l', '--intro', '--main', '--ending', '--brk', '--fill', '--ok']
const TEXT_ON_GROUND = [
  ...new Set([
    '--t',
    '--t2',
    '--m',
    '--rec',
    '--lamp-line',
    '--neutral',
    '--a',
    '--warn',
    '--tab-rest',
    '--caption-ink',
    '--header-ink',
    ...FILLS,
  ]),
]

function declarations(css: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out.set(m[1], m[2].trim())
  return out
}

/** One rule's block in blooms.css: a theme's, or `:root` (its palette entries). */
function block(css: string, selector: string): string {
  const escaped = selector.replace(/[[\]]/g, '\\$&')
  const m = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  if (!m) throw new Error(`no ${selector} block in blooms.css`)
  return m[1]
}
const themeBlock = (css: string, theme: string) => block(css, `[data-theme='${theme}']`)

function resolver(theme: Map<string, string>): (name: string) => string {
  const pal = new Map([...declarations(palette), ...declarations(block(blooms, ':root'))])
  const resolve = (name: string): string => {
    const value = theme.get(name) ?? pal.get(name)
    if (value === undefined) throw new Error(`no token ${name}`)
    const ref = /^var\((--[\w-]+)\)$/.exec(value)
    return ref ? resolve(ref[1]) : value
  }
  return resolve
}

type RGB = [number, number, number]

function rgb(hex: string): RGB {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as RGB
}

function luminance([r, g, b]: number[]): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(fg: number[], bg: number[]): number {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

const W = 1440
const H = 900
const STEP = 12
const PALETTES: [BloomPalette, BloomSection][] = [
  ['aurora', 'main'],
  ['parts', 'main'],
  ...(['intro', 'main', 'ending', 'brk', 'fill'] as BloomSection[]).map((s): [BloomPalette, BloomSection] => ['section', s]),
]

/** Samples along each bloom's drift path: its centre passes every point between rest and full drift. */
const DRIFT_STEPS = 24

/** A bloom's strongest alpha (a fraction of its weight's peak) at (x, y), over every place its centre passes, rest and swollen. */
function strongest(i: number, x: number, y: number): number {
  const s = SPOTS[i]
  const most = MOTION.lively
  let best = 0
  for (const swell of [1, 1 + most.swell]) {
    for (let d = 0; d <= DRIFT_STEPS; d++) {
      const drift = (most.drift * d) / DRIFT_STEPS
      const r = s.r * W * swell
      const cx = s.x * W + s.dx * drift * 2 * s.r * W
      const cy = s.y * H + s.dy * drift * 2 * s.r * W
      best = Math.max(best, alphaAt(Math.hypot(x - cx, y - cy) / r, s.weight))
    }
  }
  return best
}

/** Every distinct ground colour the blooms can make, worst first for the theme. */
function grounds(resolve: (n: string) => string, peak: number): RGB[] {
  const ground = rgb(resolve('--g'))
  const out: RGB[] = [ground]
  for (const [pal, section] of PALETTES) {
    const colours = hues(pal, section).map((h) => rgb(resolve(h)))
    for (let x = 0; x <= W; x += STEP) {
      for (let y = 0; y <= H; y += STEP) {
        let c: number[] = [...ground]
        colours.forEach((hue, i) => {
          const a = peak * strongest(i, x, y)
          if (a > 0) c = c.map((v, k) => v * (1 - a) + hue[k] * a)
        })
        out.push(c as RGB)
      }
    }
  }
  return out
}

const THEMES = {
  dark: new Map([...declarations(dark), ...declarations(themeBlock(blooms, 'dark'))]),
  light: new Map([...declarations(dark), ...declarations(light), ...declarations(themeBlock(blooms, 'light'))]),
}

describe('text contrast on the blooms', () => {
  for (const [theme, values] of Object.entries(THEMES)) {
    const resolve = resolver(values)
    const peak = parseFloat(resolve('--bloom-peak')) / 100
    const all = grounds(resolve, peak)

    it(`${theme}: the blooms are there (they change the ground somewhere)`, () => {
      const g = luminance(all[0])
      expect(all.some((c) => Math.abs(luminance(c) - g) > 0.002)).toBe(true)
    })

    if (theme === 'dark') {
      // The owner's bug: at 12% of the bright hues a core was about (20, 17, 31) on black, too faint
      // to see on a real screen. Each core of the app's palette (aurora) must light a channel of the
      // black ground to at least 40 of 255, plainly coloured at a glance; every other hue to at least
      // 20 (green and gold cost the most luminance, so the text leaves them the least).
      it('dark: every bloom is plainly coloured at its core', () => {
        const ground = rgb(resolve('--g'))
        for (const [pal, section] of PALETTES) {
          for (const h of hues(pal, section)) {
            const core = rgb(resolve(h)).map((v, k) => ground[k] * (1 - peak) + v * peak)
            const lift = Math.max(...core.map((v, k) => v - ground[k]))
            expect(lift, `${h} in ${pal}`).toBeGreaterThanOrEqual(hues('aurora').includes(h) ? 40 : 20)
          }
        }
      })
    }

    for (const text of TEXT_ON_GROUND) {
      it(`${theme}: ${text} on the worst spot`, () => {
        const fg = rgb(resolve(text))
        const worst = Math.min(...all.map((bg) => contrast(fg, bg)))
        expect(worst).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
})
