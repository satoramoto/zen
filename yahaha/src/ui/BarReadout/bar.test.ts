/** Bar maths (docs/specs/push/Channel.md, Check 4). */
import { describe, expect, it } from 'vitest'
import { dbText, fillBox, formatValue, fraction, HIGH_STEPS, hzUnit, LOW_STEPS, ratioText, splitDisplay, step, stepOf } from './bar'

describe('fraction', () => {
  it('gives each row its fraction', () => {
    expect(fraction({ value: 90, min: 0, max: 127 })).toBeCloseTo(0.709, 3)
    expect(fraction({ value: 64, min: 0, max: 127 })).toBeCloseTo(0.504, 3)
    expect(fraction({ value: 2, min: -12, max: 12 })).toBeCloseTo(0.583, 3)
    expect(fraction({ value: 120, min: 0, max: 0, steps: LOW_STEPS })).toBeCloseTo(12 / 36, 6)
    expect(fraction({ value: 8000, min: 0, max: 0, steps: HIGH_STEPS })).toBeCloseTo(24 / 30, 6)
    expect(fraction({ value: -18, min: -48, max: 0 })).toBeCloseTo(0.625, 3)
    expect(fraction({ value: 30, min: 10, max: 200 })).toBeCloseTo(0.105, 3)
    expect(fraction({ value: 120, min: 10, max: 1000 })).toBeCloseTo(0.111, 3)
    expect(fraction({ value: 76, min: 0, max: 127 })).toBeCloseTo(0.598, 3)
    expect(fraction({ value: 0, min: 0, max: 127 })).toBe(0)
  })
})

describe('fillBox', () => {
  it('fills from 0, or from the centre when bipolar', () => {
    expect(fillBox(0.709, false)).toEqual({ fl: 0, fw: 71 })
    expect(fillBox(0.583, true)).toEqual({ fl: 50, fw: 8 })
    expect(fillBox(0.3, true)).toEqual({ fl: 30, fw: 20 })
  })
})

describe('text', () => {
  it('formats Hz, ratios and dB', () => {
    expect(hzUnit(120)).toEqual(['120', 'Hz'])
    expect(hzUnit(8000)).toEqual(['8.0', 'kHz'])
    expect(hzUnit(1200)).toEqual(['1.2', 'kHz'])
    expect(ratioText(30)).toBe('3')
    expect(ratioText(25)).toBe('2.5')
    expect(dbText(-18)).toBe('−18')
    expect(dbText(2)).toBe('+2')
    expect(dbText(0)).toBe('0')
  })

  it('splits a display string into its number and unit', () => {
    expect(splitDisplay('0.50 Hz')).toEqual(['0.50', 'Hz'])
    expect(splitDisplay('40%')).toEqual(['40', '%'])
    expect(splitDisplay('1/8')).toEqual(['1/8', ''])
    expect(splitDisplay('On')).toEqual(['On', ''])
  })

  it('formats each kind', () => {
    expect(formatValue('number', 90)).toEqual(['90', ''])
    expect(formatValue('db', -1)).toEqual(['−1', 'dB'])
    expect(formatValue('ms', 12)).toEqual(['12', 'ms'])
    expect(formatValue('pan', 64)).toEqual(['C', ''])
    expect(formatValue('pan', 52)).toEqual(['L12', ''])
    expect(formatValue('pan', 69)).toEqual(['R5', ''])
    expect(formatValue('offset', 76)).toEqual(['+12', ''])
    expect(formatValue('offset', 60)).toEqual(['−4', ''])
    expect(formatValue('ratio', 30)).toEqual(['3', ':1'])
    expect(formatValue('display', 64, '0.50 Hz')).toEqual(['0.50', 'Hz'])
  })
})

describe('step', () => {
  it('moves by units, clamped', () => {
    expect(step(90, 1, { min: 0, max: 127 })).toBe(91)
    expect(step(125, 10, { min: 0, max: 127 })).toBe(127)
  })

  it('moves by steps of a table from the nearest one', () => {
    expect(stepOf(LOW_STEPS, 120)).toBe(12)
    expect(step(120, 1, { min: 0, max: 0, steps: LOW_STEPS })).toBe(140)
    expect(step(120, -1, { min: 0, max: 0, steps: LOW_STEPS })).toBe(110)
  })
})
