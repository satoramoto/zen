// ChordReadout's long fingering: the app's tooltip (data-tip and the tip action) rather than a
// native title, and the whole text in the readout's accessible name.

import { cleanup, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ChordReadout from './ChordReadout.svelte'

afterEach(() => cleanup())

const LONG = 'AI Full Keyboard · Keyboard transpose +2 · played Gm7 over the whole keyboard'

describe('ChordReadout fingering', () => {
  it('takes the tooltip action and no native title', () => {
    const tipAction = vi.fn()
    const { container } = render(ChordReadout, { chord: 'Gm', extension: '7', fingering: LONG, tip: 'fingering.select', tipAction })
    const fingering = container.querySelector('.fingering') as HTMLElement
    expect(fingering.textContent).toBe(LONG)
    expect(fingering.hasAttribute('title')).toBe(false)
    expect(fingering.dataset.tip).toBe('fingering.select')
    expect(tipAction).toHaveBeenCalledWith(fingering, 'fingering.select')
  })

  it('gives the tip the whole fingering as free text and updates it with the chord', async () => {
    const update = vi.fn()
    const tipAction = vi.fn(() => ({ update }))
    const { container, rerender } = render(ChordReadout, { chord: 'Gm', extension: '7', fingering: LONG, tip: 'fingering.select', tipAction })
    const fingering = container.querySelector('.fingering') as HTMLElement
    expect(fingering.dataset.tipText).toBe(LONG)
    await rerender({ chord: 'C', extension: '', fingering: 'Fingered', tip: 'fingering.select', tipAction })
    expect(fingering.dataset.tipText).toBe('Fingered')
    expect(update).toHaveBeenCalledWith('fingering.select')
  })

  it('says the whole fingering in its accessible name', () => {
    render(ChordReadout, { chord: 'Gm', extension: '7', fingering: LONG })
    expect(screen.queryByRole('img', { name: `Chord Gm7, ${LONG}` })).not.toBeNull()
  })
})
