<!--
  LineSlider: a horizontal value on a Settings page. A 2px line, the part up to the value in the
  neutral ink and the rest in the hairline colour, with a 3px cap at the value, then the value as a
  numeral with its unit small after it. Drag along the line, or focus it and use the arrows (one
  step), Page Up / Page Down (ten steps), Home and End. Controlled: it asks for a value through
  `onchange` and moves when `value` does.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'

  type Props = {
    /** The value, between `min` and `max`. */
    value: number
    min?: number
    max?: number
    /** One arrow press. */
    step?: number
    /** The accessible name ("Chord settle window"). */
    name: string
    /** The value as shown ("5.0", "Off"). Default: the number. */
    valueText?: string
    /** The unit after the value, small ("ms", "s", "%"). */
    unit?: string
    /** The line's width in px. */
    width?: number
    /** Shown, not movable: the line and value in the absent ink. Stays focusable. */
    disabled?: boolean
    /** The tooltip key from `app/src/help/tooltips.ts`, rendered as `data-tip`. */
    tip?: string
    /** The app's `use:tip` action, passed in by the wiring; applied with `tip` when both are set. */
    tipAction?: Action<HTMLElement, string>
    /** Called with the value asked for (clamped and on a step). */
    onchange?: (value: number) => void
  }

  let {
    value,
    min = 0,
    max = 127,
    step = 1,
    name,
    valueText,
    unit = '',
    width = 120,
    disabled = false,
    tip,
    tipAction,
    onchange,
  }: Props = $props()

  const span = $derived(Math.max(step, max - min))
  const fraction = $derived(Math.max(0, Math.min(1, (value - min) / span)))
  const shown = $derived(valueText ?? String(value))

  let track: HTMLSpanElement | undefined = $state()
  let dragging: number | null = null

  function clamp(v: number): number {
    const stepped = Math.round((v - min) / step) * step + min
    return Math.max(min, Math.min(max, Number(stepped.toFixed(6))))
  }

  function ask(v: number) {
    if (disabled) return
    const next = clamp(v)
    if (next !== value) onchange?.(next)
  }

  function fromPointer(event: PointerEvent) {
    const box = track?.getBoundingClientRect()
    if (!box || box.width <= 0) return
    ask(min + ((event.clientX - box.left) / box.width) * (max - min))
  }

  function pointerDown(event: PointerEvent) {
    if (disabled || event.button !== 0) return
    dragging = event.pointerId
    try {
      ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
    fromPointer(event)
  }

  function pointerMove(event: PointerEvent) {
    if (dragging === event.pointerId) fromPointer(event)
  }

  function pointerEnd(event: PointerEvent) {
    if (dragging === event.pointerId) dragging = null
  }

  function keydown(event: KeyboardEvent) {
    const moves: Record<string, number> = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + step * 10,
      PageDown: value - step * 10,
      Home: min,
      End: max,
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    ask(moves[event.key])
  }

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

<span class="slider" class:disabled>
  <span
    class="hit"
    role="slider"
    tabindex="0"
    style:width={`${width}px`}
    aria-label={name}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-valuetext={unit ? `${shown} ${unit}` : shown}
    aria-disabled={disabled ? 'true' : undefined}
    data-tip={tip}
    use:tipped={tip}
    onkeydown={keydown}
    onpointerdown={pointerDown}
    onpointermove={pointerMove}
    onpointerup={pointerEnd}
    onpointercancel={pointerEnd}
  >
    <span class="track" bind:this={track}>
      <span class="fill" style:width={`${fraction * 100}%`}></span>
      <span class="cap" style:left={`${fraction * 100}%`}></span>
    </span>
  </span>
  <span class="readout" aria-hidden="true"
    ><span class="value">{shown}</span>{#if unit}<span class="unit">{unit}</span>{/if}</span
  >
</span>

<style>
  .slider {
    --slider-line: 2px;
    --slider-cap-width: 3px;
    --slider-cap-height: 14px;
    --slider-ink: var(--neutral);
    display: inline-flex;
    align-items: center;
    gap: var(--space-12);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  .slider.disabled {
    --slider-ink: var(--absent-neutral);
  }
  .hit {
    position: relative;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    height: var(--control-height-compact);
    padding: 0 var(--space-2);
    cursor: pointer;
    touch-action: none;
  }
  .disabled .hit {
    cursor: default;
  }
  .hit:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
  .track {
    position: relative;
    flex: 1;
    height: var(--slider-line);
    background: var(--line);
  }
  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    background: var(--slider-ink);
  }
  .cap {
    position: absolute;
    top: 50%;
    width: var(--slider-cap-width);
    height: var(--slider-cap-height);
    background: var(--slider-ink);
    transform: translate(-50%, -50%);
  }
  .readout {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-4);
    white-space: nowrap;
  }
  .value {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    font-variant-numeric: tabular-nums;
  }
  .disabled .value {
    color: var(--absent-neutral);
  }
  .unit {
    color: var(--caption-ink);
  }
</style>
