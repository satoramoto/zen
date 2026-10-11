// The Looper lane across mode changes, which a story's play can't do: when a loop stops after
// playing past bar 8, the lane stays on the window that was playing, until it is paged by hand.

import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it } from 'vitest'
import { laneStart } from './faces'
import Looper from './Looper.svelte'
import { looperBoard } from './Looper.fixtures'
import type { LooperChange } from './types'

afterEach(cleanup)

const lane = () => document.body.textContent ?? ''

describe('Looper lane', () => {
  it('laneStart keeps a held window when stopped, within the loop', () => {
    expect(laneStart('off', null, 12, 1, 9)).toBe(9)
    expect(laneStart('off', null, 12, 1, null)).toBe(1)
    expect(laneStart('off', null, 4, 1, 9)).toBe(1)
    expect(laneStart('looping', 2, 12, 1, 9)).toBe(1)
  })

  it('stays on the window that was playing when the loop stops, until paged', async () => {
    const changes: LooperChange[] = []
    const props = { ...looperBoard, bars: 12, bar: 11, laneFirst: 1, onchange: (c: LooperChange) => changes.push(c) }
    const { rerender } = render(Looper, { props })
    expect(lane()).toContain('bars 9–12 of 12')

    await rerender({ mode: 'off', bar: null, running: false })
    expect(lane()).toContain('bars 9–12 of 12')

    // Paging back by hand lets go of it.
    await fireEvent.click(screen.getByRole('button', { name: 'Earlier bars' }))
    expect(changes).toContainEqual({ type: 'lanePage', first: 1 })
    expect(lane()).toContain('bars 1–8 of 12')
  })
})
