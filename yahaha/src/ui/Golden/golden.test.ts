import { describe, expect, it } from 'vitest'
import {
  addsUp,
  cellTrack,
  groupLines,
  overflows,
  PHI,
  report,
  spiralPath,
  spiralPole,
  spiralSlots,
  summary,
  weightTracks,
  type SlotMeasure,
} from './golden'

/** A spiral path's points: where it starts, then each arc's end (and any bridging line's). */
const points = (d: string): [number, number][] => {
  const out: [number, number][] = []
  for (const m of d.matchAll(/([MLA])([^MLA]*)/g)) {
    const n = m[2].trim().split(/\s+/).map(Number)
    out.push([n[n.length - 2], n[n.length - 1]])
  }
  return out
}
const near = (p: [number, number], x: number, y: number) => {
  expect(p[0]).toBeCloseTo(x, 3)
  expect(p[1]).toBeCloseTo(y, 3)
}

const slot = (over: Partial<SlotMeasure>): SlotMeasure => ({
  rect: { x: 0, y: 0, w: 50, h: 20 },
  client: { w: 50, h: 20 },
  scroll: { w: 50, h: 20 },
  clipped: [],
  name: 'slot',
  cut: false,
  ...over,
})

describe('addsUp', () => {
  it("the Stage's display row adds up to phi³", () => {
    expect(addsUp(['unison', 'unison', '1:phi', '1:phi', 'unison'], 'phi3')?.adds).toBe(true)
  })
  it('three squares do not fill a phi³ box', () => {
    const check = addsUp(['unison', 'unison', 'unison'], 'phi3')
    expect(check?.adds).toBe(false)
    expect(check?.sum).toBe(3)
  })
  it('a shape leaves it to the measurement (the tuning decides)', () => {
    expect(addsUp(['knob', 'unison'], 'phi2')).toBeUndefined()
    expect(addsUp(['unison'], undefined)).toBeUndefined()
  })
})

it('cellTrack: a cell is its interval of the cross size, or the inverse', () => {
  expect(cellTrack('phi', 'cqh')).toBe('calc(100cqh * var(--interval-phi))')
  expect(cellTrack('1:knob', 'cqw')).toBe('calc(100cqw / var(--shape-knob))')
})

describe('spiralSlots', () => {
  it('cuts squares off a phi box, the last slot the remainder', () => {
    const [first, second, rest] = spiralSlots(3)
    // The first square is as tall as the box: 1 / phi of its width.
    expect(first.w).toBeCloseTo(1 / PHI)
    expect(first.h).toBeCloseTo(1)
    // The second sits at the bottom of what is left, as wide as it.
    expect(second.x).toBeCloseTo(1 / PHI)
    expect(second.y + second.h).toBeCloseTo(1)
    // The slots cover the box exactly.
    const area = [first, second, rest].reduce((n, r) => n + r.w * r.h, 0)
    expect(area).toBeCloseTo(1)
  })
})

describe('spiralPath', () => {
  const wide = { x: 0, y: 0, w: 100 * PHI, h: 100 }
  const tall = { x: 0, y: 0, w: 100, h: 100 * PHI }

  it('from the left of a wide box by default: the first arc across the left square, then the bottom', () => {
    const d = spiralPath(wide)
    expect(d).toBe(spiralPath(wide, 12, 'left'))
    const [start, first, second] = points(d)
    near(start, 0, 0)
    near(first, 100, 100)
    // The next square sits at the bottom of what is left, as wide as it.
    near(second, 100 + 100 / PHI, 100 - 100 / PHI)
    // A phi box's arcs join up: no bridging lines.
    expect(d).not.toContain('L')
  })

  it('from the right of a wide box: the first square at its right, turning to the top', () => {
    const [start, first, second] = points(spiralPath(wide, 12, 'right'))
    near(start, 100 * PHI, 100)
    near(first, 100 * PHI - 100, 0)
    near(second, 100 * PHI - 100 - 100 / PHI, 100 / PHI)
  })

  it('from the top of a tall box: the first square across its top, turning to the left', () => {
    const d = spiralPath(tall, 12, 'top')
    const [start, first, second] = points(d)
    near(start, 100, 0)
    near(first, 0, 100)
    near(second, 100 / PHI, 100 + 100 / PHI)
    expect(d).not.toContain('L')
  })

  it('from the bottom of a tall box: the first square across its bottom', () => {
    const [start, first] = points(spiralPath(tall, 12, 'bottom'))
    near(start, 0, 100 * PHI)
    near(first, 100, 100 * PHI - 100)
  })

  it("a side that can't take a square passes the turn on: left of a tall box starts at its bottom", () => {
    expect(spiralPath(tall, 12, 'left')).toBe(spiralPath(tall, 12, 'bottom'))
  })

  it('stays inside its box, wherever it is', () => {
    const box = { x: 40, y: 10, w: 100, h: 100 * PHI }
    for (const [x, y] of points(spiralPath(box, 12, 'top'))) {
      expect(x).toBeGreaterThanOrEqual(box.x - 1e-6)
      expect(x).toBeLessThanOrEqual(box.x + box.w + 1e-6)
      expect(y).toBeGreaterThanOrEqual(box.y - 1e-6)
      expect(y).toBeLessThanOrEqual(box.y + box.h + 1e-6)
    }
  })
})

describe('spiral turn', () => {
  const stage = { x: 0, y: 0, w: 1398, h: 864 }
  const wide = { x: 0, y: 0, w: 100 * PHI, h: 100 }

  it('the default is ccw from the left, unchanged', () => {
    expect(spiralPath(wide)).toBe(spiralPath(wide, 12, 'left', 'ccw'))
    expect(spiralPath(stage, 12, 'right')).toBe(spiralPath(stage, 12, 'right', 'ccw'))
    expect(spiralPath(wide)).not.toContain(' 0 0 1 ')
  })

  it("the pole: about (1010, 238) from the left ccw, and its mirror (388, 238) from the right cw", () => {
    const [x, y] = spiralPole(stage)
    expect(Math.abs(x - 1010)).toBeLessThanOrEqual(2)
    expect(Math.abs(y - 238)).toBeLessThanOrEqual(2)
    const [cx, cy] = spiralPole(stage, 'right', 'cw')
    expect(Math.abs(cx - 388)).toBeLessThanOrEqual(2)
    expect(Math.abs(cy - 238)).toBeLessThanOrEqual(2)
  })

  it('cw from the right starts at the right edge and cuts right, bottom, left, top; its arcs join up', () => {
    const d = spiralPath(wide, 12, 'right', 'cw')
    const [start, first, second, third] = points(d)
    // The first square is the right one (as tall as the box), entered at its top right.
    near(start, 100 * PHI, 0)
    near(first, 100 * PHI - 100, 100)
    // Then the bottom of what is left, then its left.
    near(second, 100 * PHI - 100 - 100 / PHI, 100 - 100 / PHI)
    // The left square, as wide as what is left is tall: its inner corner 1 / phi² in.
    expect(third[0]).toBeCloseTo(100 / PHI ** 2, 3)
    expect(d).not.toContain('L')
    expect(d).toContain(' 0 0 1 ')
  })

  it('cw is ccw mirrored top to bottom about the box', () => {
    const box = { x: 20, y: 30, w: 100 * PHI, h: 100 }
    const ccw = points(spiralPath(box, 12, 'left'))
    const cw = points(spiralPath(box, 12, 'left', 'cw'))
    expect(cw.length).toBe(ccw.length)
    cw.forEach((p, i) => near(p, ccw[i][0], 2 * box.y + box.h - ccw[i][1]))
    const pole = spiralPole(box, 'left', 'cw')
    const mirror = spiralPole(box, 'left', 'ccw')
    expect(pole[0]).toBeCloseTo(mirror[0], 3)
    expect(pole[1]).toBeCloseTo(2 * box.y + box.h - mirror[1], 3)
  })
})

it('weightTracks: each column its interval in fr', () => {
  expect(weightTracks(['octave', 'unison'])).toBe('minmax(0, 2fr) minmax(0, 1fr)')
  expect(weightTracks(['phi'])).toBe(`minmax(0, ${+PHI.toFixed(6)}fr)`)
})

describe('overflow', () => {
  it('a slot overflows when its content is past it, or when text in it is cut short', () => {
    expect(overflows(slot({}))).toBe(false)
    expect(overflows(slot({ scroll: { w: 50, h: 24 } }))).toBe(true)
    expect(overflows(slot({ clipped: ['Retrig rate'] }))).toBe(true)
    // Under a px is rounding, not overflow.
    expect(overflows(slot({ scroll: { w: 50.6, h: 20 } }))).toBe(false)
  })

  it('the report names what overflows, the spare round each box, and the rows that do not add up', () => {
    const r = report(
      [slot({ clipped: ['Retrig rate'] }), slot({ name: 'value', scroll: { w: 50, h: 30 } }), slot({})],
      [{ shape: 'knob', rect: { x: 0, y: 0, w: 54, h: 88 }, slot: { x: 0, y: 0, w: 54, h: 115 } }],
      [
        { name: 'display', rect: { x: 0, y: 0, w: 1, h: 1 }, along: 100, sum: 100 },
        { name: 'short', rect: { x: 0, y: 0, w: 1, h: 1 }, along: 100, sum: 90 },
        { name: 'named', rect: { x: 0, y: 0, w: 1, h: 1 }, along: 0, sum: 0, declared: false },
      ],
      [],
    )
    expect(r.overflow).toEqual(['Retrig rate', 'value'])
    expect(r.slots.map((s) => s.off)).toEqual([true, true, false])
    expect(r.rowsOff).toEqual(['short', 'named'])
    expect(r.boxes[0]).toMatchObject({ spareW: 0, spareH: 27 })
    expect(summary(r, 'knob')).toBe("knob 54 × 88 · spare 0 × 27 · overflow 2 (Retrig rate, value) · 2 of 3 rows don't add up")
    expect(r.groups).toEqual([])
  })

  it('each named node gets its size, its spare and the overflow of the slots it owns', () => {
    const r = report(
      [
        slot({ clipped: ['Retrig rate'], group: 1, depth: 2 }),
        slot({ name: 'value', scroll: { w: 50, h: 30 }, group: 0, depth: 1 }),
        slot({ group: 1 }),
      ],
      [],
      [],
      [],
      [
        { name: 'hero', depth: 0, rect: { x: 0, y: 0, w: 1398.4, h: 282 } },
        { name: 'knob', depth: 2, rect: { x: 0, y: 0, w: 54, h: 115 }, fit: { x: 0, y: 13.5, w: 54, h: 88 } },
      ],
    )
    expect(r.slots.map((s) => s.depth)).toEqual([2, 1, 0])
    expect(r.groups[0]).toEqual({ name: 'hero', depth: 0, w: 1398.4, h: 282, spareW: 0, spareH: 0, overflow: ['value'] })
    expect(r.groups[1]).toMatchObject({ spareW: 0, spareH: 27, overflow: ['Retrig rate'] })
    expect(groupLines(r)).toEqual(['hero 1398 × 282 · spare 0 × 0 · overflow 1 (value)', 'knob 54 × 115 · spare 0 × 27 · overflow 1 (Retrig rate)'])
    expect(groupLines(report([], [], [], [], [{ name: 'hero', depth: 0, rect: { x: 0, y: 0, w: 1398, h: 282 } }]))).toEqual([
      'hero 1398 × 282 · spare 0 × 0 · overflow 0',
    ])
  })
})
