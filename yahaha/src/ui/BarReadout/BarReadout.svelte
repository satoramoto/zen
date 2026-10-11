<!--
  BarReadout: one 32px row of the Channel page's groups (docs/specs/push/Channel.md, "Bar
  readout"): the label, a thin bar (a 2px track, the fill and a 2×12 cap in `--neutral`, which the
  page points at the part's hue) and the value with its unit small after it. The bar is a slider:
  press anywhere and drag sideways (relative, 2px a unit, Shift 8px), the wheel and the arrows step
  one, Page Up / Page Down ten, Home and End the ends, a double-click resets to `default`. While an
  edit is live the fill and value follow the local value. Controlled: it sends through `onchange`.
-->
<script lang="ts">
  import { onDestroy } from 'svelte'
  import type { Action } from 'svelte/action'
  import type { BarKind } from '../Channel/types'
  import { fillBox, formatValue, fraction, step } from './bar'

  type Props = {
    /** The row's label ("Level"). */
    label: string
    /** The value, in the control's own units (with `steps`: Hz, shown as given). */
    value: number
    /** The lowest value. */
    min: number
    /** The highest value. */
    max: number
    /** A Hz table: the bar sits at the nearest step and every move goes by steps of it. */
    steps?: number[]
    /** How the value shows (number, dB, ms, Hz, pan, offset, ratio, or the `display` string). */
    kind?: BarKind
    /** The value as the state gives it, for kind `display` ("0.50 Hz", "1/8", "On"). */
    display?: string
    /** The fill grows from the centre (pan, gains). */
    bipolar?: boolean
    /** The value a double-click resets to. */
    default: number
    /** Not there: "—", no fill, drawn in the absent ink; still focusable, sends nothing. */
    disabled?: boolean
    /** The words a disabled row reads after its name ("not available"). */
    absent?: string
    /** The hardware fader hasn't reached the value yet (soft takeover): a "↕" after the label. */
    waiting?: boolean
    /** Words appended to the spoken value (", off"). */
    suffix?: string
    /** The accessible name; default the label. */
    name?: string
    /** The tooltip key from `app/src/help/tooltips.ts`, rendered as `data-tip`. */
    tip?: string
    /** The app's `use:tip` action, passed in by the wiring; applied with `tip` when both are set. */
    tipAction?: Action<HTMLElement, string>
    /** Called with each value sent. */
    onchange?: (value: number) => void
  }

  let {
    label,
    value,
    min,
    max,
    steps,
    kind = 'number',
    display,
    bipolar = false,
    default: reset,
    disabled = false,
    absent = 'not available',
    waiting = false,
    suffix = '',
    name,
    tip,
    tipAction,
    onchange,
  }: Props = $props()

  /** The value a live edit shows until the state catches up; null: none. */
  let local: number | null = $state(null)
  let lastSent: number | null = null
  let drag: { id: number; x0: number; v0: number } | null = null
  let frame = 0
  let pending: number | null = null
  let hold: ReturnType<typeof setTimeout> | undefined

  const shown = $derived(local ?? value)
  const stepped = $derived(steps !== undefined && steps.length > 0)
  const lo = $derived(stepped ? steps![0] : min)
  const hi = $derived(stepped ? steps![steps!.length - 1] : max)
  const box = $derived(fillBox(fraction({ value: shown, min, max, steps }), bipolar))
  const pct = $derived(Math.round(fraction({ value: shown, min, max, steps }) * 100))
  const text = $derived.by((): [string, string] => {
    if (disabled) return ['—', '']
    if (kind === 'display' && local !== null) return [String(local), '']
    return formatValue(kind, shown, display)
  })
  const ariaName = $derived(name ?? label)
  const valueText = $derived.by(() => {
    const [v, unit] = text
    const base = disabled ? `${ariaName}, ${absent}` : `${ariaName} ${v}${unit ? (/^[A-Za-z]/.test(unit) ? ' ' : '') + unit : ''}`
    return `${base}${waiting ? ', hardware fader away' : ''}${suffix}`
  })

  // A live edit ends when the state reports the value last sent (or after the hold below).
  $effect(() => {
    // Read both before any short-circuit, so the effect always tracks them.
    const now = value
    const live = local
    if (live !== null && drag === null && lastSent !== null && now === lastSent) release()
  })

  function release() {
    clearTimeout(hold)
    hold = undefined
    local = null
  }

  /** Keeps the local value until the state matches it, or 500 ms after the last send. */
  function holdLocal() {
    clearTimeout(hold)
    hold = setTimeout(() => {
      if (drag === null) local = null
    }, 500)
  }

  function send(v: number) {
    lastSent = v
    onchange?.(v)
    holdLocal()
  }

  /** A wheel or key edit: shown at once and sent when it differs. */
  function nudge(next: number) {
    if (disabled) return
    if (next === shown) return
    local = next
    send(next)
  }

  function flush() {
    frame = 0
    if (pending !== null && pending !== lastSent) send(pending)
    pending = null
  }

  function pointerDown(event: PointerEvent) {
    if (disabled || event.button !== 0) return
    drag = { id: event.pointerId, x0: event.clientX, v0: shown }
    lastSent = shown
    clearTimeout(hold)
    try {
      ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
  }

  function pointerMove(event: PointerEvent) {
    if (drag === null || drag.id !== event.pointerId) return
    const delta = Math.trunc((event.clientX - drag.x0) / (event.shiftKey ? 8 : 2))
    const next = step(drag.v0, delta, { min, max, steps })
    local = next
    pending = next
    if (frame === 0) frame = requestAnimationFrame(flush)
  }

  function pointerEnd(event: PointerEvent) {
    if (drag === null || drag.id !== event.pointerId) return
    drag = null
    if (frame !== 0) cancelAnimationFrame(frame)
    frame = 0
    pending = null
    if (local !== null && local !== lastSent) send(local)
    else if (local === null || local === value) release()
    else holdLocal()
  }

  function wheel(event: WheelEvent) {
    if (event.deltaY === 0) return
    event.preventDefault()
    nudge(step(shown, event.deltaY < 0 ? 1 : -1, { min, max, steps }))
  }

  function keydown(event: KeyboardEvent) {
    const deltas: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }
    let next: number
    if (event.key in deltas) next = step(shown, deltas[event.key], { min, max, steps })
    else if (event.key === 'Home') next = lo
    else if (event.key === 'End') next = hi
    else return
    event.preventDefault()
    event.stopPropagation()
    nudge(next)
  }

  function dblclick() {
    if (disabled) return
    local = reset
    send(reset)
  }

  onDestroy(() => {
    if (frame !== 0) cancelAnimationFrame(frame)
    clearTimeout(hold)
  })

  /** Applies the parent's tooltip action when both it and a key are given. */
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

<div class="row" class:disabled>
  <span class="label">{label}{#if waiting}<span class="away" aria-hidden="true">↕</span>{/if}</span>
  <span
    class="bar"
    role="slider"
    tabindex="0"
    aria-label={ariaName}
    aria-valuemin={lo}
    aria-valuemax={hi}
    aria-valuenow={disabled ? undefined : shown}
    aria-valuetext={valueText}
    aria-disabled={disabled ? 'true' : undefined}
    data-face={disabled ? 'disabled' : 'off'}
    data-tip={tip}
    use:tipped={tip}
    onpointerdown={pointerDown}
    onpointermove={pointerMove}
    onpointerup={pointerEnd}
    onpointercancel={pointerEnd}
    onwheel={wheel}
    onkeydown={keydown}
    ondblclick={dblclick}
  >
    <span class="track"></span>
    {#if !disabled}
      <span class="fill" style:left={`${box.fl}%`} style:width={`${box.fw}%`}></span>
      <span class="cap" style:left={`calc(${pct}% - 1px)`}></span>
    {/if}
  </span>
  <span class="slot" aria-hidden="true"
    ><span class="value">{text[0]}</span>{#if text[1]}<span class="unit">{text[1]}</span>{/if}</span
  >
</div>

<style>
  .row {
    --bar-label-width: 76px;
    --bar-value-width: 58px;
    --bar-min-width: 64px; /* the bar's own width when nothing sizes the row (about 72 in a column) */
    --bar-line: 2px;
    --bar-cap-width: 2px;
    --bar-cap-height: 12px;
    display: grid;
    grid-template-columns: var(--bar-label-width) minmax(var(--bar-min-width), 1fr) var(--bar-value-width);
    align-items: center;
    gap: var(--space-10);
    /* A page may give its rows more air (`--row-height`); the bar fills the row either way. */
    height: var(--row-height, var(--control-height));
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .label {
    overflow: hidden;
    color: var(--caption-ink);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .away {
    margin-left: var(--space-4);
    color: var(--caption-ink);
  }
  .bar {
    position: relative;
    height: var(--row-height, var(--control-height));
    background: transparent;
    border: 0;
    cursor: ew-resize;
    touch-action: none;
  }
  .bar:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--line-width));
  }
  .track,
  .fill {
    position: absolute;
    top: 50%;
    height: var(--bar-line);
    transform: translateY(-50%);
  }
  .track {
    left: 0;
    right: 0;
    background: var(--line);
  }
  .fill {
    background: var(--neutral);
  }
  .cap {
    position: absolute;
    top: 50%;
    width: var(--bar-cap-width);
    height: var(--bar-cap-height);
    background: var(--neutral);
    transform: translateY(-50%);
  }
  .slot {
    display: flex;
    justify-content: flex-end;
    align-items: baseline;
    overflow: hidden;
    white-space: nowrap;
  }
  .value {
    flex: none;
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    font-variant-numeric: tabular-nums;
  }
  .unit {
    flex: none;
    margin-left: var(--space-2);
    color: var(--caption-ink);
  }
  .disabled .label,
  .disabled .value {
    color: var(--absent);
  }
  .disabled .track {
    background: var(--absent);
  }
  .disabled .bar {
    cursor: default;
  }
</style>
