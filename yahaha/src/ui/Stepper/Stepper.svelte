<!--
  Stepper: a value stepped with − and +. The value (a numeral or a note name) with its unit small
  after it, then the − and + buttons. `large` draws the value at the hero size, for a page's main
  number (the split point, a transpose).
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'

  type Props = {
    /** The value as shown ("F#2", "+2", "0"). */
    value: string
    /** The unit after it, small ("semitones", "MIDI 54"). */
    unit?: string
    /** `text` one size with the row; `large` the hero size. */
    size?: 'text' | 'large'
    /** The − button's accessible name ("Split point one key down"). */
    nameDown: string
    /** The + button's accessible name. */
    nameUp: string
    /** The − and + buttons' tooltip keys. */
    tipDown?: string
    tipUp?: string
    /** At the bottom of its range: − is shown, not pressable. */
    atMin?: boolean
    /** At the top of its range: + is shown, not pressable. */
    atMax?: boolean
    /** The app's `use:tip` action, passed to both buttons. */
    tipAction?: Action<HTMLElement, string>
    /** − pressed. */
    ondown?: () => void
    /** + pressed. */
    onup?: () => void
  }

  let {
    value,
    unit = '',
    size = 'text',
    nameDown,
    nameUp,
    tipDown,
    tipUp,
    atMin = false,
    atMax = false,
    tipAction,
    ondown,
    onup,
  }: Props = $props()
</script>

<span class="stepper {size}">
  <span class="readout" aria-live="polite"
    ><span class="value">{value}</span>{#if unit}<span class="unit">{unit}</span>{/if}</span
  >
  <span class="buttons">
    <Button symbol="minus" size="icon" name={nameDown} tip={tipDown} disabled={atMin} {tipAction} onpress={ondown} />
    <Button symbol="plus" size="icon" name={nameUp} tip={tipUp} disabled={atMax} {tipAction} onpress={onup} />
  </span>
</span>

<style>
  .stepper {
    display: inline-flex;
    align-items: center;
    gap: var(--space-16);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  .readout {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-8);
    white-space: nowrap;
  }
  .value {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    font-variant-numeric: tabular-nums;
  }
  .large .value {
    font: var(--type-large);
    letter-spacing: var(--tracking-large);
    font-variant-numeric: tabular-nums;
  }
  .unit {
    color: var(--caption-ink);
  }
  .buttons {
    display: inline-flex;
    gap: var(--space-4);
  }
</style>
