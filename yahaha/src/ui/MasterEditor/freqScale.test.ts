// A Master EQ band's frequency control: a log grid across the band's range, and typed whole Hz.

import { describe, expect, it } from 'vitest'
import { stepOf } from '../Readout/readout'
import { freqGrid, nearestStep, parseHz } from './freqScale'

describe('freqGrid', () => {
  it('runs from the range\'s bottom to its top, rising, fine enough for one step per arrow key', () => {
    for (const [lo, hi] of [[32, 2000], [100, 10000], [500, 16000]]) {
      const grid = freqGrid(lo, hi)
      expect(grid[0]).toBe(lo)
      expect(grid[grid.length - 1]).toBe(hi)
      for (let i = 1; i < grid.length; i++) expect(grid[i]).toBeGreaterThan(grid[i - 1])
      expect(stepOf(0, grid.length - 1)).toBe(1)
      // Off the XG steps: far finer than they are (theirs are about 12% apart).
      for (let i = 1; i < grid.length; i++) expect(grid[i] / grid[i - 1]).toBeLessThan(1.05)
    }
  })
  it('keeps the band\'s own Hz among the steps', () => {
    const grid = freqGrid(100, 10000, 1234)
    expect(grid).toContain(1234)
    expect(grid[nearestStep(grid, 1234)]).toBe(1234)
    expect(freqGrid(100, 10000, 50)).not.toContain(50)
  })
  it('steps off the XG frequencies: one step up from 80 Hz is 82', () => {
    const grid = freqGrid(32, 2000, 80)
    expect(grid[nearestStep(grid, 80) + 1]).toBe(82)
  })
})

describe('parseHz', () => {
  it('takes typed digits as whole Hz, clamped to the range', () => {
    expect(parseHz('1234', 100, 10000)).toBe(1234)
    expect(parseHz('20', 100, 10000)).toBe(100)
    expect(parseHz('99999', 500, 16000)).toBe(16000)
    expect(parseHz('', 100, 10000)).toBeNull()
  })
})
