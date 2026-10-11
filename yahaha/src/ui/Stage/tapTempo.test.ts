import { describe, expect, it } from 'vitest'
import { TAP_RESET_MS, tapTempo } from './tapTempo'

function tapAll(times: number[]) {
  let taps: number[] = []
  let bpm: number | undefined
  for (const t of times) ({ taps, bpm } = tapTempo(taps, t))
  return { taps, bpm }
}

describe('tapTempo', () => {
  it('gives no tempo from one tap', () => {
    expect(tapAll([1000]).bpm).toBeUndefined()
  })

  it('gives the tempo from two taps', () => {
    expect(tapAll([1000, 1500]).bpm).toBe(120)
  })

  it('averages the last four taps only', () => {
    // A slow first interval (1 s = 60 BPM), then three at 400 ms (150 BPM): the first drops out.
    const { taps, bpm } = tapAll([0, 1000, 1400, 1800, 2200])
    expect(taps).toEqual([1000, 1400, 1800, 2200])
    expect(bpm).toBe(150)
  })

  it('starts again after a long pause', () => {
    const { taps, bpm } = tapAll([0, 500, 500 + TAP_RESET_MS + 1])
    expect(taps).toEqual([500 + TAP_RESET_MS + 1])
    expect(bpm).toBeUndefined()
  })
})
