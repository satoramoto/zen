<!--
  Knob: one of the eight band knobs. The plain name above, the value and unit in the accent, a
  bare 44px 270° ring arc with a small tip dot at the arc's end, and the Genos code beneath. An
  unused knob shows only its dim name and an empty ring. Fully controlled: a drag (relative: a
  step every 4px up or right, 16px with Shift, never jumping to the pointer), ↑ → / ↓ ← and the
  wheel (a step a notch; a trackpad's small deltas add up to one) ask for steps through
  `onstep`; a click that didn't turn it calls `onpress`.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'

  type Props = {
    /** The plain name ("Dynamics", "Retrig rate"). For an unused knob, the board's "---". */
    label: string
    /** The Genos code beneath the ring ("DynCtrl"). */
    code?: string
    /** The value as shown ("127", "1/8", "Off"). */
    value?: string
    /** A small unit after the value ("%"). */
    unit?: string
    /** How far round the arc is, 0–1 of its 270°. */
    fraction?: number
    /** Nothing is mapped to this knob: dim name, an empty ring, no value. */
    unused?: boolean
    /** The accessible name. Default: "{label} ({code}) {value}{unit}", or "unused". */
    name?: string
    /** The tooltip key, rendered as `data-tip`. */
    tip?: string
    /** The app's `use:tip` action, applied with `tip` when both are set. */
    tipAction?: Action<HTMLElement, string>
    /** Called on a click that didn't turn the knob, Space or Enter. */
    onpress?: () => void
    /** Called with the steps turned (positive: clockwise): ±1 on a key or a wheel notch, the steps a drag covered. Not when unused. */
    onstep?: (delta: number) => void
  }

  let {
    label,
    code = '',
    value = '',
    unit = '',
    fraction = 0,
    unused = false,
    name,
    tip,
    tipAction,
    onpress,
    onstep,
  }: Props = $props()

  // The ring's geometry in its own 44 × 44 box: radius 21, the arc starting 225° clockwise from
  // the top (bottom left) and sweeping 270°.
  const C = 22
  const R = 21
  const START = 225
  const SWEEP = 270

  function point(deg: number) {
    const th = (deg * Math.PI) / 180
    return { x: C + R * Math.sin(th), y: C - R * Math.cos(th) }
  }
  function arc(from: number, to: number) {
    if (to - from <= 0) return ''
    const a = point(from)
    const b = point(to)
    const large = to - from > 180 ? 1 : 0
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
  }

  let deg = $derived(unused ? 0 : Math.round(Math.min(1, Math.max(0, fraction)) * SWEEP))
  let lit = $derived(arc(START, START + deg))
  let rest = $derived(arc(START + deg, START + SWEEP))
  let tipAt = $derived(point(START + deg))
  let spoken = $derived(name ?? (unused ? 'unused' : `${label}${code ? ` (${code})` : ''} ${value}${unit}`))

  function keydown(event: KeyboardEvent) {
    if (unused) return
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key] ?? 0
    if (step === 0) return
    event.preventDefault()
    onstep?.(step)
  }

  // The wheel: a step a notch. A trackpad sends many small deltas: they add up to a notch
  // (WHEEL_PX) before the knob steps, so a swipe turns it a few steps, not dozens.
  const WHEEL_PX = 20
  let wheelAcc = 0

  function wheel(event: WheelEvent) {
    if (unused || event.deltaY === 0) return
    event.preventDefault()
    const px = event.deltaMode === 1 ? event.deltaY * WHEEL_PX : event.deltaMode === 2 ? event.deltaY * WHEEL_PX * 10 : event.deltaY
    if (Math.sign(px) !== Math.sign(wheelAcc)) wheelAcc = 0
    wheelAcc += px
    if (Math.abs(wheelAcc) < WHEEL_PX) return
    wheelAcc = 0
    onstep?.(px < 0 ? 1 : -1)
  }

  // A drag turns it relative to where it is, as the old app's knob: up (or right) is
  // clockwise, a step every 4px (Shift: every 16px, fine). It never jumps to the pointer.
  const DRAG_PX = 4
  const FINE_PX = 16
  let dragId: number | null = null
  let lastX = 0
  let lastY = 0
  let dragAcc = 0
  /** This press turned the knob: its click isn't also a press. */
  let turned = false

  function pointerdown(event: PointerEvent) {
    turned = false
    if (unused || event.button !== 0) return
    dragId = event.pointerId
    lastX = event.clientX
    lastY = event.clientY
    dragAcc = 0
    try {
      ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
  }

  function pointermove(event: PointerEvent) {
    if (dragId !== event.pointerId) return
    dragAcc += (lastY - event.clientY + (event.clientX - lastX)) / (event.shiftKey ? FINE_PX : DRAG_PX)
    lastX = event.clientX
    lastY = event.clientY
    const steps = Math.trunc(dragAcc)
    if (steps === 0) return
    dragAcc -= steps
    turned = true
    onstep?.(steps)
  }

  function pointerend(event: PointerEvent) {
    if (dragId === event.pointerId) dragId = null
  }

  function click(event: MouseEvent) {
    // A drag isn't a press; Enter / Space (detail 0) always are.
    if (turned && event.detail > 0) {
      turned = false
      return
    }
    onpress?.()
  }

  const tipped: Action<HTMLElement, string | undefined> = (node, key) => {
    if (!tipAction || key === undefined) return
    const handle = tipAction(node, key)
    return {
      update: (next) => {
        if (next !== undefined) handle?.update?.(next)
      },
      destroy: () => handle?.destroy?.(),
    }
  }
</script>

<button
  type="button"
  class="knob"
  class:unused
  data-tip={tip}
  aria-label={spoken}
  onclick={click}
  onpointerdown={pointerdown}
  onpointermove={pointermove}
  onpointerup={pointerend}
  onpointercancel={pointerend}
  onkeydown={keydown}
  onwheel={wheel}
  use:tipped={tip}
>
  <span class="label">{label}</span>
  <span class="value">{unused ? '' : value}{#if unit && !unused}<span class="unit">{unit}</span>{/if}</span>
  <svg class="ring" viewBox="0 0 44 44" aria-hidden="true">
    {#if unused}
      <path class="empty" d={arc(START, START + SWEEP)} />
    {:else}
      {#if rest}<path class="rest" d={rest} />{/if}
      {#if lit}<path class="lit" d={lit} />{/if}
      <circle class="dot" cx={tipAt.x} cy={tipAt.y} r="3" />
    {/if}
  </svg>
  <span class="code">{code}</span>
</button>

<style>
  .knob {
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    min-width: 0;
    height: var(--knob-height);
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    font-family: var(--font-sans);
    font-variant-numeric: tabular-nums;
    text-align: center;
    white-space: nowrap;
    cursor: ns-resize;
    touch-action: none;
  }
  .unused {
    cursor: default;
  }
  /* A name or code wider than the knob spills over its neighbours by default; a narrow layout
     sets --knob-text-max to 100% and --knob-text-overflow to hidden, and it ends in an ellipsis
     (the full name is spoken). */
  .label,
  .code {
    max-width: var(--knob-text-max, none);
    overflow: var(--knob-text-overflow, visible);
    text-overflow: ellipsis;
    height: var(--knob-label-height);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
    line-height: var(--knob-label-height);
  }
  .label {
    color: var(--t2);
  }
  .unused .label {
    color: var(--d);
  }
  .code {
    color: var(--m);
  }
  .value {
    height: var(--knob-value-height);
    color: var(--a);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    font-variant-numeric: tabular-nums;
    line-height: var(--knob-value-height);
  }
  .unit {
    margin-left: var(--space-2);
  }
  .ring {
    display: block;
    flex: none;
    width: var(--knob-ring);
    height: var(--knob-ring);
    margin-top: var(--knob-ring-gap);
    overflow: visible;
  }
  .ring path {
    fill: none;
    stroke-width: var(--knob-stroke);
  }
  .lit {
    stroke: var(--a);
  }
  .rest {
    stroke: var(--knob-rest);
  }
  .empty {
    stroke: var(--knob-unused);
  }
  .dot {
    fill: var(--a);
  }
  .knob:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
</style>
