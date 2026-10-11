import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Readout from './Readout.svelte'
import { dragValue, fraction, splitUnit, stepOf } from './readout'

afterEach(cleanup)

describe('readout maths', () => {
  it('drags relative to the press: half the bar is half the range', () => {
    expect(dragValue(38, 48, 96, 0, 90)).toBe(83)
    expect(dragValue(38, -200, 96, 0, 90)).toBe(0)
    expect(dragValue(38, 10, 0, 0, 90)).toBe(38)
  })

  it('places the value in its range', () => {
    expect(fraction(2, 0, 7)).toBeCloseTo(2 / 7)
    expect(fraction(-1, 0, 7)).toBe(0)
    expect(fraction(3, 5, 5)).toBe(0)
  })

  it('splits off the unit', () => {
    expect(splitUnit('38%')).toEqual(['38', '%'])
    expect(splitUnit('5.0 kHz')).toEqual(['5.0', 'kHz'])
    expect(splitUnit('0.29 Hz')).toEqual(['0.29', 'Hz'])
    expect(splitUnit('22 ms')).toEqual(['22', 'ms'])
    expect(splitUnit('2.4 s')).toEqual(['2.4', 's'])
    expect(splitUnit('+1 dB')).toEqual(['+1', 'dB'])
    expect(splitUnit('1/8')).toEqual(['1/8', ''])
    expect(splitUnit('3 of 8')).toEqual(['3 of 8', ''])
    expect(splitUnit('Off')).toEqual(['Off', ''])
  })

  it('steps 1 on a 0–127 range, coarser on a wide one', () => {
    expect(stepOf(0, 127)).toBe(1)
    expect(stepOf(10, 2000)).toBe(16)
  })
})

describe('Readout', () => {
  function setup(props: Partial<{ value: number; defaultValue: number; disabled: boolean }> = {}) {
    const onchange = vi.fn()
    render(Readout, { label: 'Feedback', value: 38, min: 0, max: 90, display: '38%', code: 'K6', onchange, ...props })
    const slider = screen.getByRole('slider', { name: 'Feedback' })
    const bar = slider.querySelector<HTMLElement>('[data-part="bar"]')!
    bar.getBoundingClientRect = () => ({ width: 96, height: 2, x: 0, y: 0, top: 0, left: 0, right: 96, bottom: 2, toJSON: () => ({}) })
    return { slider, onchange }
  }
  const at = (clientX: number) => ({ pointerId: 1, button: 0, clientX, clientY: 0 })

  it('is a named slider that speaks its label and value', () => {
    const { slider } = setup()
    expect(slider.getAttribute('aria-label')).toBe('Feedback')
    expect(slider.getAttribute('aria-valuetext')).toBe('Feedback 38%')
    expect(slider.getAttribute('aria-valuenow')).toBe('38')
  })

  it('drags sideways: half the bar adds half the range, reported once on release', async () => {
    const { slider, onchange } = setup()
    await fireEvent.pointerDown(slider, at(0))
    await fireEvent.pointerMove(slider, at(48))
    await fireEvent.pointerUp(slider, at(48))
    expect(onchange).toHaveBeenCalledTimes(1)
    expect(onchange).toHaveBeenCalledWith(83)
  })

  it('sends nothing for a press alone', async () => {
    const { slider, onchange } = setup()
    await fireEvent.pointerDown(slider, at(10))
    await fireEvent.pointerUp(slider, at(10))
    expect(onchange).not.toHaveBeenCalled()
  })

  it('steps on a wheel notch', async () => {
    const { slider, onchange } = setup()
    await fireEvent.wheel(slider, { deltaY: -100 })
    expect(onchange).toHaveBeenCalledWith(39)
  })

  it('handles its keys and keeps them from the window', async () => {
    const { slider, onchange } = setup()
    const right = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    slider.dispatchEvent(right)
    expect(right.defaultPrevented).toBe(true)
    expect(onchange).toHaveBeenLastCalledWith(39)
    const end = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })
    slider.dispatchEvent(end)
    expect(end.defaultPrevented).toBe(true)
    expect(onchange).toHaveBeenLastCalledWith(90)
    expect(onchange).toHaveBeenCalledTimes(2)
  })

  it('swallows Space without a change', () => {
    const { slider, onchange } = setup()
    const onWindow = vi.fn()
    window.addEventListener('keydown', onWindow)
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    slider.dispatchEvent(space)
    window.removeEventListener('keydown', onWindow)
    expect(space.defaultPrevented).toBe(true)
    expect(onWindow).not.toHaveBeenCalled()
    expect(onchange).not.toHaveBeenCalled()
  })

  it('goes back to its default on a double-click', async () => {
    const { slider, onchange } = setup({ value: 36, defaultValue: 64 })
    await fireEvent.dblClick(slider)
    expect(onchange).toHaveBeenCalledTimes(1)
    expect(onchange).toHaveBeenCalledWith(64)
  })

  it('sends nothing while disabled', async () => {
    const { slider, onchange } = setup({ disabled: true, defaultValue: 64 })
    await fireEvent.pointerDown(slider, at(0))
    await fireEvent.pointerMove(slider, at(48))
    await fireEvent.pointerUp(slider, at(48))
    await fireEvent.wheel(slider, { deltaY: -100 })
    await fireEvent.keyDown(slider, { key: 'ArrowRight' })
    await fireEvent.dblClick(slider)
    expect(onchange).not.toHaveBeenCalled()
    expect(slider.getAttribute('aria-disabled')).toBe('true')
  })
})
