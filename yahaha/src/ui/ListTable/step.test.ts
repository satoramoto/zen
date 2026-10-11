import { describe, expect, it } from 'vitest'
import { stepSelection } from './step'

const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

describe('stepSelection', () => {
  it('moves one row with the arrows, clamped at the ends', () => {
    expect(stepSelection(ids, 'c', 'ArrowDown', 3)).toBe('d')
    expect(stepSelection(ids, 'c', 'ArrowUp', 3)).toBe('b')
    expect(stepSelection(ids, 'g', 'ArrowDown', 3)).toBe('g')
    expect(stepSelection(ids, 'a', 'ArrowUp', 3)).toBe('a')
  })

  it('moves a page with PageUp and PageDown, clamped', () => {
    expect(stepSelection(ids, 'b', 'PageDown', 3)).toBe('e')
    expect(stepSelection(ids, 'e', 'PageDown', 3)).toBe('g')
    expect(stepSelection(ids, 'f', 'PageUp', 3)).toBe('c')
    expect(stepSelection(ids, 'b', 'PageUp', 3)).toBe('a')
  })

  it('treats a page below one row as one row', () => {
    expect(stepSelection(ids, 'b', 'PageDown', 0)).toBe('c')
    expect(stepSelection(ids, 'b', 'PageUp', 0.5)).toBe('a')
  })

  it('jumps to the ends with Home and End', () => {
    expect(stepSelection(ids, 'd', 'Home', 3)).toBe('a')
    expect(stepSelection(ids, 'd', 'End', 3)).toBe('g')
  })

  it('with nothing selected, starts at the first or the last row', () => {
    for (const key of ['ArrowDown', 'Home', 'PageDown']) expect(stepSelection(ids, null, key, 3)).toBe('a')
    for (const key of ['ArrowUp', 'End', 'PageUp']) expect(stepSelection(ids, null, key, 3)).toBe('g')
  })

  it('treats a selection not in the list as nothing selected', () => {
    expect(stepSelection(ids, 'gone', 'ArrowDown', 3)).toBe('a')
    expect(stepSelection(ids, 'gone', 'ArrowUp', 3)).toBe('g')
  })

  it('returns null for other keys and for an empty list', () => {
    expect(stepSelection(ids, 'c', 'Enter', 3)).toBeNull()
    expect(stepSelection(ids, 'c', 'ArrowLeft', 3)).toBeNull()
    expect(stepSelection([], null, 'ArrowDown', 3)).toBeNull()
    expect(stepSelection([], 'a', 'Home', 3)).toBeNull()
  })
})
