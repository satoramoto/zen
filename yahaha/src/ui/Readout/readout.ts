// A Readout's and a StepValue's maths and their shared press-drag-wheel-key handling
// (docs/specs/push/Effects.md › Kit additions › Readout, FX-D9). Pure functions, and one Svelte
// action, `adjust`, that both controls put on their element.

import type { Action } from 'svelte/action'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Where `value` sits in `min`–`max`, 0–1 (a bar's fill). */
export function fraction(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return clamp((value - min) / (max - min), 0, 1)
}

/** The value after a horizontal drag of `dx` px from `v0`, when `width` px spans the whole range. */
export function dragValue(v0: number, dx: number, width: number, min: number, max: number): number {
  if (width <= 0) return clamp(Math.round(v0), min, max)
  return clamp(Math.round(v0 + (dx * (max - min)) / width), min, max)
}

/** One wheel notch or arrow key's step: 1 for a 0–127 range, coarser for a wide one (10–2000 ms). */
export function stepOf(min: number, max: number): number {
  return Math.max(1, Math.round((max - min) / 127))
}

const UNITS = [' kHz', ' Hz', ' ms', ' dB', ' s']

/**
 * A shown value split into its number and unit: "38%" → ["38", "%"], "5.0 kHz" → ["5.0", "kHz"],
 * "+1 dB" → ["+1", "dB"]. Anything else whole, with no unit ("1/8", "3 of 8", "Off").
 */
export function splitUnit(value: string): [string, string] {
  if (/^[^\s%]+%$/.test(value)) return [value.slice(0, -1), '%']
  for (const unit of UNITS) {
    if (value.endsWith(unit) && value.length > unit.length && !value.slice(0, -unit.length).includes(' ')) {
      return [value.slice(0, -unit.length), unit.trim()]
    }
  }
  return [value, '']
}

/** What `adjust` needs: the value, its range, and where a change goes. */
export interface AdjustParams {
  value: number
  min: number
  max: number
  /** Where a double-click puts it; none: a double-click does nothing. */
  defaultValue?: number
  /** Shown, not settable: nothing is sent. */
  disabled?: boolean
  /** The px a drag across the whole range takes (a Readout's bar width). */
  span: () => number
  /** A new whole value, different from the one shown. */
  onchange?: (value: number) => void
}

/** The keys a focused control handles: none of them reach the window's shortcuts. */
const KEYS = new Set(['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Enter'])

/**
 * Press anywhere on the element and drag sideways (relative to the press, like a fader: the span
 * stands for the whole range); a wheel notch or an arrow key steps it, Page Up / Down by ten steps,
 * Home and End to the ends; a double-click puts it back to its default. A press without movement
 * sends nothing; while dragging, at most one change per animation frame, and the last one on release.
 */
export const adjust: Action<HTMLElement, AdjustParams> = (node, initial) => {
  let p = initial
  let drag: { id: number; x0: number; v0: number; width: number; sent: number } | null = null
  let pending: number | null = null
  let frame = 0

  function send(v: number) {
    if (p.disabled || v === p.value) return
    p.onchange?.(v)
  }
  function flush() {
    frame = 0
    if (pending === null || !drag) return
    const v = pending
    pending = null
    if (v !== drag.sent) {
      drag.sent = v
      p.onchange?.(v)
    }
  }
  function down(e: PointerEvent) {
    if (p.disabled || e.button !== 0) return
    drag = { id: e.pointerId, x0: e.clientX, v0: p.value, width: p.span(), sent: p.value }
    if (typeof node.setPointerCapture === 'function') {
      try {
        node.setPointerCapture(e.pointerId)
      } catch {
        // A synthetic pointer (tests) can't be captured; the drag still works.
      }
    }
    node.dataset.dragging = ''
  }
  function move(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.id) return
    const v = dragValue(drag.v0, e.clientX - drag.x0, drag.width, p.min, p.max)
    if (v === drag.sent && pending === null) return
    pending = v
    if (typeof requestAnimationFrame !== 'function') flush()
    else if (!frame) frame = requestAnimationFrame(flush)
  }
  function up(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.id) return
    if (frame) cancelAnimationFrame(frame)
    flush()
    drag = null
    delete node.dataset.dragging
  }
  function wheel(e: WheelEvent) {
    if (p.disabled) return
    e.preventDefault()
    const dir = e.deltaY < 0 || e.deltaX > 0 ? 1 : -1
    send(clamp(p.value + dir * stepOf(p.min, p.max), p.min, p.max))
  }
  function key(e: KeyboardEvent) {
    if (!KEYS.has(e.key)) return
    e.preventDefault()
    e.stopPropagation()
    const step = stepOf(p.min, p.max)
    const to: Record<string, number> = {
      ArrowRight: p.value + step,
      ArrowUp: p.value + step,
      ArrowLeft: p.value - step,
      ArrowDown: p.value - step,
      PageUp: p.value + 10 * step,
      PageDown: p.value - 10 * step,
      Home: p.min,
      End: p.max,
    }
    if (e.key in to) send(clamp(to[e.key], p.min, p.max))
  }
  function dblclick() {
    if (p.defaultValue !== undefined) send(p.defaultValue)
  }

  node.addEventListener('pointerdown', down)
  node.addEventListener('pointermove', move)
  node.addEventListener('pointerup', up)
  node.addEventListener('pointercancel', up)
  node.addEventListener('wheel', wheel, { passive: false })
  node.addEventListener('keydown', key)
  node.addEventListener('dblclick', dblclick)
  return {
    update(next) {
      p = next
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame)
      node.removeEventListener('pointerdown', down)
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerup', up)
      node.removeEventListener('pointercancel', up)
      node.removeEventListener('wheel', wheel)
      node.removeEventListener('keydown', key)
      node.removeEventListener('dblclick', dblclick)
    },
  }
}
