// StageGolden's tempo line (− Tap +) fires its callbacks, and every transport icon key in the
// Pads header has an accessible name (the keys show only an icon).

import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte'
import type { ComponentProps } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { stageBoard } from '../Stage/Stage.fixtures'
import StageGolden from './StageGolden.svelte'

afterEach(() => cleanup())

function setup() {
  const ontaptempo = vi.fn()
  const ontempoup = vi.fn<(down: boolean) => void>()
  const ontempodown = vi.fn<(down: boolean) => void>()
  const props = { ...stageBoard, ontaptempo, ontempoup, ontempodown } as ComponentProps<typeof StageGolden>
  render(StageGolden, props)
  return { ontaptempo, ontempoup, ontempodown }
}

describe('StageGolden tempo line', () => {
  it('Tap fires ontaptempo once a press', async () => {
    const { ontaptempo } = setup()
    const tap = screen.getByRole('button', { name: 'Tap tempo' })
    await fireEvent.click(tap)
    await fireEvent.click(tap)
    expect(ontaptempo).toHaveBeenCalledTimes(2)
  })

  it('+ and − step the tempo, held and released', async () => {
    const { ontempoup, ontempodown } = setup()
    const plus = screen.getByRole('button', { name: 'Tempo up (Scene Launch)' })
    const minus = screen.getByRole('button', { name: 'Tempo down (Function)' })
    await fireEvent.pointerDown(plus, { button: 0 })
    await fireEvent.pointerUp(plus)
    expect(ontempoup.mock.calls).toEqual([[true], [false]])
    await fireEvent.pointerDown(minus, { button: 0 })
    await fireEvent.pointerUp(minus)
    expect(ontempodown.mock.calls).toEqual([[true], [false]])
    expect(ontempoup).toHaveBeenCalledTimes(2)
  })
})

describe('StageGolden transport', () => {
  it('names every icon key in the Pads header', () => {
    setup()
    const transport = screen.getByRole('toolbar', { name: 'Transport' })
    const keys = within(transport).getAllByRole('button')
    expect(keys.length).toBe(7)
    for (const key of keys) expect(key.querySelector('svg.icon')).not.toBeNull()
    // The same buttons queried by a non-empty accessible name: none is nameless.
    const named = within(transport).getAllByRole('button', { name: /\w/ })
    expect(named).toEqual(keys)
    const names = named.map((key) => key.getAttribute('aria-label'))
    expect(new Set(names).size).toBe(keys.length)
  })
})
