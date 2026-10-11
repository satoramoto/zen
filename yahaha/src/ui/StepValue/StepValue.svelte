<!--
  StepValue: a value you set in place, with no bar: an optional tag in its hue ("R2") then the value
  in the accent ("16"). The Readout's handling in a small cell (a part's send, a Master EQ band's
  gain): press and drag sideways (`span` px for the whole range), a wheel notch or an arrow key
  steps it, Page Up / Down by ten steps, Home and End to the ends, a double-click back to its
  default (`adjust`, ../Readout/readout.ts). Controlled: it shows `display` and asks for a new
  value through onchange.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import { adjust } from '../Readout/readout'

  type Props = {
    /** The value, in `min`–`max`. */
    value: number
    min?: number
    max?: number
    /** Where a double-click puts it; none: a double-click does nothing. */
    defaultValue?: number
    /** The value as shown ("16", "+4", "1k"). Default: the number. */
    display?: string
    /** A short tag before the value, in `hue` ("R2"). */
    tag?: string
    /** The tag's hue: a part's, or `t` neutral. */
    hue?: 't' | 'r1' | 'r2' | 'r3' | 'l'
    /** The value's ink: `a` the accent (a level), `t` plain text (a table cell). */
    ink?: 'a' | 't'
    /** Faded (a part that doesn't sound): the tag and value at reduced strength. Still settable. */
    dim?: boolean
    /** Shown, not settable. Stays focusable. */
    disabled?: boolean
    /** The px a drag across the whole range takes. */
    span?: number
    /** The slider's accessible name ("Right 2 delay send"). */
    name: string
    /** The spoken value, when `display` alone isn't enough ("16"). Default: `display`. */
    valuetext?: string
    /** The tooltip key from `app/src/help/tooltips.ts`, rendered as `data-tip`. */
    tip?: string
    /** The app's `use:tip` action, passed in by the wiring; applied with `tip` when both are set. */
    tipAction?: Action<HTMLElement, string>
    /** A new whole value, from a drag, a wheel notch, a key or a double-click. */
    onchange?: (value: number) => void
  }

  let {
    value,
    min = 0,
    max = 127,
    defaultValue,
    display,
    tag,
    hue = 't',
    ink = 'a',
    dim = false,
    disabled = false,
    span = 128,
    name,
    valuetext,
    tip,
    tipAction,
    onchange,
  }: Props = $props()

  const shown = $derived(display ?? String(value))

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

<span
  class="step ink-{ink}"
  class:dim
  class:disabled
  role="slider"
  tabindex="0"
  aria-label={name}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  aria-valuetext={valuetext ?? shown}
  aria-disabled={disabled ? 'true' : undefined}
  data-hue={dim || disabled ? 'd' : hue}
  data-tip={tip}
  use:tipped={tip}
  use:adjust={{ value, min, max, defaultValue, disabled, span: () => span, onchange }}
>
  {#if tag}<span class="tag">{tag}</span>{/if}<span class="value">{shown}</span>
</span>

<style>
  .step {
    --hue: var(--neutral);
    --hue-absent: var(--absent-neutral);
    display: inline-flex;
    align-items: center;
    gap: var(--space-4);
    box-sizing: border-box;
    height: var(--step-height, 28px);
    padding: 0 var(--space-2);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    cursor: ew-resize;
    touch-action: none;
    user-select: none;
  }
  .step[data-hue='r1'] {
    --hue: var(--r1);
  }
  .step[data-hue='r2'] {
    --hue: var(--r2);
  }
  .step[data-hue='r3'] {
    --hue: var(--r3);
  }
  .step[data-hue='l'] {
    --hue: var(--l);
  }
  .tag {
    color: var(--hue);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .value {
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    font-variant-numeric: tabular-nums;
  }
  .ink-a .value {
    color: var(--a);
  }
  .ink-t .value {
    color: var(--value-ink);
  }
  .dim .tag,
  .disabled .tag {
    color: var(--absent);
  }
  .dim .value,
  .disabled .value {
    color: var(--absent-a);
  }
  .ink-t.dim .value,
  .ink-t.disabled .value {
    color: var(--absent);
  }
  .disabled {
    cursor: default;
  }
  .step:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: 0;
  }
</style>
