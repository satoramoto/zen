import { describe, expect, it } from 'vitest'
import { cpuPercent } from './cpu'

describe('cpuPercent', () => {
  it('one decimal below 10%, whole percent from 10%', () => {
    expect(cpuPercent(0)).toBe('0.0')
    expect(cpuPercent(0.004)).toBe('0.4')
    expect(cpuPercent(0.012)).toBe('1.2')
    expect(cpuPercent(0.0999)).toBe('10')
    expect(cpuPercent(0.12)).toBe('12')
    expect(cpuPercent(1.5)).toBe('150')
  })
})
