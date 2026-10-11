<!--
  Readout: a labelled value with a bar, the page's parameter control (no sliders or knobs on
  screen): the label, a thin bar filled in the accent to where the value sits in its range, the
  value in the accent with its unit split off, and the Launchkey knob that moves it. One 36px
  hairline row. It is the control for its value: press anywhere on it and drag sideways (the bar's
  width stands for the whole range), a wheel notch or an arrow key steps it, Page Up / Down by ten
  steps, Home and End to the ends, a double-click back to its default (`adjust`, readout.ts).
  Controlled: it shows `value` and `display` as given and asks for a new value through onchange.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import { adjust, fraction, splitUnit } from './readout'

  type Props = {
    /** The word at the left ("Feedback"); also the slider's accessible name. */
    label: string
    /** The value, in `min`–`max`. */
    value: number
    min?: number
    max?: number
    /** Where a double-click puts it; none: a double-click does nothing. */
    defaultValue?: number
    /** The value as shown, unit included ("38%", "5.0 kHz", "1/8"); the unit is drawn smaller. Default: the number. */
    display?: string
    /** The Launchkey knob that moves it ("K6"); empty: none. */
    code?: string
    /** Shown, not settable: the label and value fade, the bar empties, nothing is sent. Stays focusable. */
    disabled?: boolean
    /** The accessible name when the label alone isn't enough ("Delay feedback"). Default: the label. */
    name?: string
    /** The tooltip key from `app/src/help/tooltips.ts`, rendered as `data-tip`. */
    tip?: string
    /** The app's `use:tip` action, passed in by the wiring; applied with `tip` when both are set. */
    tipAction?: Action<HTMLElement, string>
    /** A new whole value, from a drag, a wheel notch, a key or a double-click. */
    onchange?: (value: number) => void
  }

  let {
    label,
    value,
    min = 0,
    max = 127,
    defaultValue,
    display,
    code = '',
    disabled = false,
    name,
    tip,
    tipAction,
    onchange,
  }: Props = $props()

  let bar: HTMLSpanElement | undefined = $state()

  const shown = $derived(display ?? String(value))
  const parts = $derived(splitUnit(shown))
  const fill = $derived(disabled ? 0 : fraction(value, min, max))

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

<div
  class="readout"
  class:disabled
  role="slider"
  tabindex="0"
  aria-label={name ?? label}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  aria-valuetext="{label} {shown}"
  aria-disabled={disabled ? 'true' : undefined}
  data-tip={tip}
  use:tipped={tip}
  use:adjust={{ value, min, max, defaultValue, disabled, span: () => bar?.getBoundingClientRect().width || 96, onchange }}
>
  <span class="label">{label}</span>
  <span class="bar" data-part="bar" aria-hidden="true"><span class="fill" style:width="{fill * 100}%"></span></span>
  <span class="value"
    >{parts[0]}{#if parts[1]}<span class="unit">{parts[1]}</span>{/if}</span
  >
  <span class="code">{code}</span>
</div>

<style>
  .readout {
    display: grid;
    grid-template-columns: var(--readout-label-width, 96px) minmax(0, 1fr) 76px 28px;
    align-items: center;
    column-gap: var(--space-12);
    box-sizing: border-box;
    width: 100%;
    height: var(--readout-height, 36px);
    border-bottom: var(--line-width) solid var(--line);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    cursor: ew-resize;
    touch-action: none;
    user-select: none;
  }
  .label {
    overflow: hidden;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-overflow: ellipsis;
  }
  .bar {
    position: relative;
    height: var(--space-2);
    background: var(--line);
  }
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--a);
  }
  .value {
    overflow: hidden;
    color: var(--a);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    font-variant-numeric: tabular-nums;
    text-align: right;
    text-overflow: ellipsis;
  }
  .unit {
    margin-left: var(--space-2);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .code {
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .disabled {
    cursor: default;
  }
  .disabled .label,
  .disabled .value,
  .disabled .code {
    color: var(--absent);
  }
  .readout:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--focus-offset));
  }
</style>
