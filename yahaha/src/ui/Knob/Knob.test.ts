// Knob's input: a drag turns it relative to where it is (never to the pointer), keys and the
// wheel step it, and a click that turned it isn't also a press.

import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Knob from './Knob.svelte'

afterEach(() => cleanup())

function setup(props: { unused?: boolean } = {}) {
  const onstep = vi.fn<(delta: number) => void>()
  const onpress = vi.fn()
  render(Knob, { label: 'Swing', code: 'Swing', value: '0', fraction: 0, name: 'Swing knob', onstep, onpress, ...props })
  return { onstep, onpress, knob: screen.getByRole('button', { name: 'Swing knob' }) }
}

const steps = (f: ReturnType<typeof vi.fn>) => f.mock.calls.reduce((n, c) => n + (c[0] as number), 0)

describe('Knob drag', () => {
  it('a step every 4px up, from where the pointer went down, wherever on the knob that was', async () => {
    const { onstep, knob } = setup()
    await fireEvent.pointerDown(knob, { pointerId: 1, button: 0, clientX: 0, clientY: 300 })
    expect(onstep).not.toHaveBeenCalled()
    await fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 298 })
    expect(onstep).not.toHaveBeenCalled()
    await fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 290 })
    expect(steps(onstep)).toBe(2)
    // Net 6px down from where it went down: one step back past the start, the rest carried.
    await fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 306 })
    expect(steps(onstep)).toBe(-1)
    await fireEvent.pointerUp(knob, { pointerId: 1 })
    await fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 200 })
    expect(steps(onstep)).toBe(-1)
  })

  it('Shift turns it fine: a step every 16px', async () => {
    const { onstep, knob } = setup()
    await fireEvent.pointerDown(knob, { pointerId: 1, button: 0, clientX: 0, clientY: 100 })
    await fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 68, shiftKey: true })
    expect(steps(onstep)).toBe(2)
  })

  it('a click after a drag is not a press; a plain click is', async () => {
    const { onpress, knob } = setup()
    await fireEvent.pointerDown(knob, { pointerId: 1, button: 0, clientX: 0, clientY: 100 })
    await fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 90 })
    await fireEvent.pointerUp(knob, { pointerId: 1 })
    await fireEvent.click(knob, { detail: 1 })
    expect(onpress).not.toHaveBeenCalled()
    await fireEvent.pointerDown(knob, { pointerId: 1, button: 0, clientX: 0, clientY: 100 })
    await fireEvent.pointerUp(knob, { pointerId: 1 })
    await fireEvent.click(knob, { detail: 1 })
    expect(onpress).toHaveBeenCalledTimes(1)
  })

  it('an unused knob doesn\'t turn', async () => {
    const { onstep, knob } = setup({ unused: true })
    await fireEvent.pointerDown(knob, { pointerId: 1, button: 0, clientX: 0, clientY: 100 })
    await fireEvent.pointerMove(knob, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.keyDown(knob, { key: 'ArrowUp' })
    await fireEvent.wheel(knob, { deltaY: -100 })
    expect(onstep).not.toHaveBeenCalled()
  })
})

describe('Knob keys and wheel', () => {
  it('↑ → +1, ↓ ← −1', async () => {
    const { onstep, knob } = setup()
    for (const key of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) await fireEvent.keyDown(knob, { key })
    expect(onstep.mock.calls.map((c) => c[0])).toEqual([1, 1, -1, -1, 1])
  })

  it('a wheel notch is one step; a trackpad swipe of many small deltas is a few, not one per event', async () => {
    const { onstep, knob } = setup()
    await fireEvent.wheel(knob, { deltaY: -100 })
    expect(onstep.mock.calls.map((c) => c[0])).toEqual([1])
    onstep.mockClear()
    for (let i = 0; i < 30; i++) await fireEvent.wheel(knob, { deltaY: 2 })
    expect(steps(onstep)).toBe(-3)
  })
})
