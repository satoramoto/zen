// Fader's input: keys, wheel and drag ask for levels through `onlevel`, and steps in quick
// succession count from the level last asked for until `level` catches up.

import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Fader from './Fader.svelte'

afterEach(() => cleanup())

function setup(level = 90) {
  const onlevel = vi.fn<(level: number) => void>()
  const r = render(Fader, { name: 'Right 1 90', value: String(level), level, onlevel })
  return { onlevel, fader: screen.getByRole('button', { name: 'Right 1 90' }), r }
}

describe('Fader keys', () => {
  it('five ↑ before the state answers ask for five steps, not the same level five times', async () => {
    const { onlevel, fader } = setup(90)
    for (let i = 0; i < 5; i++) await fireEvent.keyDown(fader, { key: 'ArrowUp' })
    expect(onlevel.mock.calls.map((c) => c[0])).toEqual([91, 92, 93, 94, 95])
  })

  it('once the state answers, steps count from the level it sent', async () => {
    const { onlevel, fader, r } = setup(90)
    await fireEvent.keyDown(fader, { key: 'ArrowUp' })
    await r.rerender({ level: 91, value: '91' })
    // Something else (the Launchkey) moves it on: the state's level wins once it matches nothing asked.
    await r.rerender({ level: 40, value: '40' })
    await fireEvent.keyDown(fader, { key: 'ArrowDown' })
    expect(onlevel.mock.calls.map((c) => c[0])).toEqual([91, 39])
  })

  it('after a pause the state\'s level wins over an ask it never confirmed', async () => {
    vi.useFakeTimers()
    try {
      const { onlevel, fader } = setup(90)
      await fireEvent.keyDown(fader, { key: 'ArrowUp' })
      vi.advanceTimersByTime(1000)
      await fireEvent.keyDown(fader, { key: 'ArrowUp' })
      expect(onlevel.mock.calls.map((c) => c[0])).toEqual([91, 91])
    } finally {
      vi.useRealTimers()
    }
  })

  it('Page Up / Down ±10, Home 0, End 127, → and ←, clamped', async () => {
    const { onlevel, fader } = setup(120)
    await fireEvent.keyDown(fader, { key: 'PageUp' })
    await fireEvent.keyDown(fader, { key: 'Home' })
    await fireEvent.keyDown(fader, { key: 'ArrowLeft' })
    await fireEvent.keyDown(fader, { key: 'End' })
    await fireEvent.keyDown(fader, { key: 'ArrowRight' })
    expect(onlevel.mock.calls.map((c) => c[0])).toEqual([127, 0, 0, 127, 127])
  })
})

describe('Fader wheel', () => {
  it('a notch moves 2; a trackpad\'s small deltas add up to a notch first', async () => {
    const { onlevel, fader } = setup(90)
    await fireEvent.wheel(fader, { deltaY: -100 })
    expect(onlevel.mock.calls.map((c) => c[0])).toEqual([92])
    for (let i = 0; i < 4; i++) await fireEvent.wheel(fader, { deltaY: 4 })
    expect(onlevel).toHaveBeenCalledTimes(1)
    await fireEvent.wheel(fader, { deltaY: 4 })
    expect(onlevel.mock.calls.map((c) => c[0])).toEqual([92, 90])
  })

  it('a parked fader asks for nothing', async () => {
    const onlevel = vi.fn()
    render(Fader, { name: 'Fader 7 unused', kind: 'parked', onlevel })
    const fader = screen.getByRole('button', { name: 'Fader 7 unused' })
    await fireEvent.keyDown(fader, { key: 'ArrowUp' })
    await fireEvent.wheel(fader, { deltaY: -100 })
    expect(onlevel).not.toHaveBeenCalled()
  })
})
