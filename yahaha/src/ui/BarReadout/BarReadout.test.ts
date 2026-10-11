/**
 * BarReadout as a control (docs/specs/push/Channel.md, Check 5): drags over fake animation
 * frames, the wheel, keys, the reset and the local value, which a story's play can't time.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BarReadout from './BarReadout.svelte'
import { LOW_STEPS } from './bar'

// The two DOM matchers these tests use (the web tests have no jest-dom).
interface DomMatchers<R = unknown> {
  toHaveAttribute(name: string, value?: string): R
  toHaveTextContent(text: string): R
}
/** `expect` with the two DOM matchers typed (registered below with `expect.extend`). */
const dom = (el: Element | null) => expect(el) as unknown as DomMatchers<void>
expect.extend({
  toHaveAttribute(el: Element, name: string, value?: string) {
    const got = el.getAttribute(name)
    const pass = value === undefined ? got !== null : got === value
    return { pass, message: () => `expected ${name}${value === undefined ? '' : `="${value}"`}, got ${JSON.stringify(got)}` }
  },
  toHaveTextContent(el: Element | null, text: string) {
    const got = el?.textContent ?? ''
    return { pass: got.includes(text), message: () => `expected text containing "${text}", got "${got}"` }
  },
})

let frames: FrameRequestCallback[] = []

/** Runs the animation frames requested so far. */
function runFrames() {
  const now = frames
  frames = []
  for (const cb of now) cb(0)
}

beforeEach(() => {
  frames = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.push(cb)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = []
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function level(extra: Record<string, unknown> = {}) {
  const onchange = vi.fn()
  const view = render(BarReadout, { label: 'Level', value: 90, min: 0, max: 127, default: 100, onchange, ...extra })
  return { ...view, onchange, slider: screen.getByRole('slider') }
}

const P = { pointerId: 1, button: 0 }

describe('BarReadout', () => {
  it('reads as a slider', () => {
    const { slider } = level()
    dom(slider).toHaveAttribute('aria-valuenow', '90')
    dom(slider).toHaveAttribute('aria-valuemin', '0')
    dom(slider).toHaveAttribute('aria-valuemax', '127')
    dom(slider).toHaveAttribute('aria-valuetext', 'Level 90')
    dom(slider).toHaveAttribute('aria-label', 'Level')
    dom(slider).toHaveAttribute('data-face', 'off')
  })

  it('a 20px drag sends 100 once, and nothing more on pointerup', async () => {
    const { slider, onchange } = level()
    await fireEvent.pointerDown(slider, { ...P, clientX: 50 })
    await fireEvent.pointerMove(slider, { ...P, clientX: 60 })
    await fireEvent.pointerMove(slider, { ...P, clientX: 70 })
    expect(onchange).not.toHaveBeenCalled()
    runFrames()
    expect(onchange).toHaveBeenCalledTimes(1)
    expect(onchange).toHaveBeenLastCalledWith(100)
    await fireEvent.pointerUp(slider, { ...P, clientX: 70 })
    expect(onchange).toHaveBeenCalledTimes(1)
  })

  it('pointerup sends a value the frame has not sent yet', async () => {
    const { slider, onchange } = level()
    await fireEvent.pointerDown(slider, { ...P, clientX: 50 })
    await fireEvent.pointerMove(slider, { ...P, clientX: 54 })
    await fireEvent.pointerUp(slider, { ...P, clientX: 54 })
    expect(onchange).toHaveBeenCalledTimes(1)
    expect(onchange).toHaveBeenLastCalledWith(92)
  })

  it('a press without movement sends nothing', async () => {
    const { slider, onchange } = level()
    await fireEvent.pointerDown(slider, { ...P, clientX: 50 })
    await fireEvent.pointerUp(slider, { ...P, clientX: 50 })
    runFrames()
    expect(onchange).not.toHaveBeenCalled()
  })

  it('Shift drags one unit per 8px', async () => {
    const { slider, onchange } = level()
    await fireEvent.pointerDown(slider, { ...P, clientX: 50, shiftKey: true })
    await fireEvent.pointerMove(slider, { ...P, clientX: 70, shiftKey: true })
    runFrames()
    await fireEvent.pointerUp(slider, { ...P, clientX: 70, shiftKey: true })
    expect(onchange).toHaveBeenCalledTimes(1)
    expect(onchange).toHaveBeenLastCalledWith(92)
  })

  it('the wheel steps one unit, up positive', async () => {
    const { slider, onchange } = level()
    await fireEvent.wheel(slider, { deltaY: -100 })
    expect(onchange).toHaveBeenLastCalledWith(91)
  })

  for (const [key, sent] of [
    ['ArrowRight', 91],
    ['ArrowUp', 91],
    ['ArrowDown', 89],
    ['ArrowLeft', 89],
    ['PageUp', 100],
    ['PageDown', 80],
    ['End', 127],
    ['Home', 0],
  ] as const) {
    it(`${key} sends ${sent}`, async () => {
      const { slider, onchange } = level()
      await fireEvent.keyDown(slider, { key })
      expect(onchange).toHaveBeenCalledTimes(1)
      expect(onchange).toHaveBeenLastCalledWith(sent)
    })
  }

  it('a double-click sends the default, even when already there', async () => {
    const { slider, onchange } = level({ value: 100 })
    await fireEvent.dblClick(slider)
    expect(onchange).toHaveBeenCalledTimes(1)
    expect(onchange).toHaveBeenLastCalledWith(100)
  })

  it('waiting reads the fader away', () => {
    const { slider, container } = level({ waiting: true })
    dom(slider).toHaveAttribute('aria-valuetext', 'Level 90, hardware fader away')
    dom(slider).toHaveAttribute('aria-label', 'Level')
    dom(container).toHaveTextContent('↕')
  })

  it('a stepped row moves by steps of its table', async () => {
    const onchange = vi.fn()
    render(BarReadout, { label: 'Low freq', value: 120, min: 32, max: 2000, steps: LOW_STEPS, kind: 'hz', default: 80, onchange })
    const slider = screen.getByRole('slider')
    dom(slider).toHaveAttribute('aria-valuetext', 'Low freq 120 Hz')
    dom(slider).toHaveAttribute('aria-valuemin', '32')
    dom(slider).toHaveAttribute('aria-valuemax', '2000')
    await fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(onchange).toHaveBeenLastCalledWith(140)
    cleanup()
    render(BarReadout, { label: 'Low freq', value: 120, min: 32, max: 2000, steps: LOW_STEPS, kind: 'hz', default: 80, onchange })
    await fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowLeft' })
    expect(onchange).toHaveBeenLastCalledWith(110)
  })

  it('a pan row reads C', () => {
    render(BarReadout, { label: 'Pan', value: 64, min: 0, max: 127, kind: 'pan', bipolar: true, default: 64 })
    dom(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'Pan C')
  })

  it('a ratio joins its unit', () => {
    render(BarReadout, { label: 'Ratio', value: 30, min: 10, max: 200, kind: 'ratio', default: 30, suffix: ', off' })
    dom(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'Ratio 3:1, off')
  })

  it('disabled reads its absence and sends nothing', async () => {
    const onchange = vi.fn()
    const { container } = render(BarReadout, {
      label: 'Send 5',
      value: 0,
      min: 0,
      max: 127,
      default: 0,
      disabled: true,
      absent: 'not added',
      onchange,
    })
    const slider = screen.getByRole('slider')
    dom(slider).toHaveAttribute('aria-valuetext', 'Send 5, not added')
    dom(slider).toHaveAttribute('aria-disabled', 'true')
    dom(slider).toHaveAttribute('tabindex', '0')
    dom(slider).toHaveAttribute('data-face', 'disabled')
    expect(slider.hasAttribute('aria-valuenow')).toBe(false)
    dom(container).toHaveTextContent('—')
    await fireEvent.pointerDown(slider, { ...P, clientX: 50 })
    await fireEvent.pointerMove(slider, { ...P, clientX: 90 })
    runFrames()
    await fireEvent.pointerUp(slider, { ...P, clientX: 90 })
    await fireEvent.wheel(slider, { deltaY: -100 })
    await fireEvent.keyDown(slider, { key: 'ArrowRight' })
    await fireEvent.keyDown(slider, { key: 'End' })
    await fireEvent.dblClick(slider)
    expect(onchange).not.toHaveBeenCalled()
  })

  it('shows the local value during a drag, and lets go when the state catches up', async () => {
    const { slider, container, rerender, onchange } = level()
    await fireEvent.pointerDown(slider, { ...P, clientX: 50 })
    await fireEvent.pointerMove(slider, { ...P, clientX: 70 })
    dom(slider).toHaveAttribute('aria-valuenow', '100')
    dom(container.querySelector('.value')).toHaveTextContent('100')
    runFrames()
    // A state frame from before the send doesn't snap it back.
    await rerender({ value: 95 })
    dom(slider).toHaveAttribute('aria-valuenow', '100')
    await fireEvent.pointerUp(slider, { ...P, clientX: 70 })
    dom(slider).toHaveAttribute('aria-valuenow', '100')
    await rerender({ value: 100 })
    await rerender({ value: 97 })
    dom(slider).toHaveAttribute('aria-valuenow', '97')
    expect(onchange).toHaveBeenCalledTimes(1)
  })

  it('lets go of the local value 500 ms after the last send', async () => {
    vi.useFakeTimers()
    try {
      const { slider } = level()
      await fireEvent.keyDown(slider, { key: 'ArrowRight' })
      dom(slider).toHaveAttribute('aria-valuenow', '91')
      await vi.advanceTimersByTimeAsync(500)
      dom(slider).toHaveAttribute('aria-valuenow', '90')
    } finally {
      vi.useRealTimers()
    }
  })

  it('a display row shows the local number bare', async () => {
    const { container } = render(BarReadout, { label: 'Speed', value: 64, min: 0, max: 127, kind: 'display', display: '0.50 Hz', default: 64 })
    dom(container.querySelector('.value')).toHaveTextContent('0.50')
    dom(container.querySelector('.unit')).toHaveTextContent('Hz')
    await fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' })
    dom(container.querySelector('.value')).toHaveTextContent('65')
    expect(container.querySelector('.unit')).toBeNull()
  })
})
