import { describe, expect, it } from 'vitest'
import { eqBands } from '../Effects/Effects.fixtures'
import { eqDots, eqPath, eqResponse, xOf, yOf } from './eqCurve'

const FREQS = [20, 50, 100, 300, 1000, 3000, 8000, 15000, 20000]

describe('eqResponse', () => {
  it('is 0 dB everywhere for a flat EQ', () => {
    for (const db of eqResponse(eqBands([0, 0, 0, 0, 0, 0, 0, 0]), FREQS)) expect(db).toBeCloseTo(0, 6)
  })

  it('peaks at about +4 dB at a +4 dB peaking band’s centre', () => {
    const bands = eqBands([0, 0, 0, 0, 0, 4, 0, 0])
    const [centre, far] = eqResponse(bands, [bands[5].freq, 30])
    expect(centre).toBeCloseTo(4, 1)
    expect(Math.abs(far)).toBeLessThan(0.1)
  })

  it('lifts the lows with a +6 dB low shelf and leaves the highs', () => {
    const [low, high] = eqResponse(eqBands([6, 0, 0, 0, 0, 0, 0, 0]), [20, 10000])
    expect(low).toBeCloseTo(6, 0)
    expect(Math.abs(high)).toBeLessThan(0.2)
  })

  it('lifts the highs with a +6 dB high shelf and leaves the lows', () => {
    const [low, high] = eqResponse(eqBands([0, 0, 0, 0, 0, 0, 0, 6]), [50, 20000])
    expect(Math.abs(low)).toBeLessThan(0.2)
    expect(high).toBeCloseTo(6, 0)
  })

  it('treats band 1 as a peak when it is not a shelf', () => {
    const bands = eqBands([6, 0, 0, 0, 0, 0, 0, 0]).map((b, i) => (i === 0 ? { ...b, shelf: false } : b))
    const [centre, far] = eqResponse(bands, [80, 20])
    expect(centre).toBeCloseTo(6, 1)
    expect(far).toBeLessThan(centre)
  })
})

describe('the drawing', () => {
  it('maps the axes: 20 Hz left, 20 kHz right, 0 dB in the middle, clamped at ±12', () => {
    expect(xOf(20, 400)).toBeCloseTo(0)
    expect(xOf(20000, 400)).toBeCloseTo(400)
    expect(yOf(0, 72)).toBe(36)
    expect(yOf(30, 72)).toBe(0)
    expect(yOf(-30, 72)).toBe(72)
  })

  it('draws a flat EQ as a straight line at 0 dB', () => {
    const path = eqPath(eqBands([0, 0, 0, 0, 0, 0, 0, 0]), 400, 72, 4)
    expect(path).toBe('M0 36 L133.3 36 L266.7 36 L400 36')
  })

  it('puts a dot per band on the curve', () => {
    const dots = eqDots(eqBands([4, 1, 0, 0, 0, 0, 2, 4]), 400, 72)
    expect(dots).toHaveLength(8)
    expect(dots[2].y).toBeLessThanOrEqual(36)
    expect(dots[0].y).toBeLessThan(36)
  })
})
