<!--
  OneTouchPicker: One Touch on the display, "One Touch   1  2  3  4". The words in --caption-ink,
  then the numbers as plain text, no boxes: --tab-rest at rest, brightening to --t on hover; the
  applied one in --t and underlined. Numbers past `count` are disabled (--d). Every word and number
  is the one small size (--type-text). A click asks for that One Touch through `onapply` and
  changes nothing itself. With `cells` there is no wrapper: the label and each number are top-level
  elements for the parent's grid to place, one a cell.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'

  type Props = {
    /** The applied One Touch, 1 to `numbers`; 0 when none is. */
    applied?: number
    /** How many One Touch settings the style has: numbers past it are disabled. */
    count?: number
    /** How many numbers to draw. */
    numbers?: number
    /** The words before the numbers. */
    label?: string
    /** `horizontal`: one line, "One Touch 1 2 3 4". `vertical`: the words on top and the numbers stacked under them (the golden Stage's One Touch block). */
    orientation?: 'horizontal' | 'vertical'
    /**
     * Cells: no wrapper. The label (visible text, spoken) and each number are top-level elements,
     * 1 + `numbers` of them, each filling its parent's cell, so a GoldenGrid lays them out one a
     * cell. The label is a plain caption (--caption-ink, flush left); each number an outlined
     * --neutral face, the applied one solid with --on-ink (`data-face` on), past `count` disabled
     * in the absent strength. `orientation` and `name` are unused: the parent supplies the group role and name.
     */
    cells?: boolean
    /** Cells: the numbers' hue, `neutral` or `a` (the style's violet: a One Touch is a setting of the style; the golden Stage). */
    hue?: 'neutral' | 'a'
    /** The group's accessible name. Default: says which is applied and the Launchkey's Shift + pads 9 to 12. */
    name?: string
    /** The app's tooltip action (`use:tip`), applied to each number with its key `ots.<n>`. */
    tipAction?: Action<HTMLElement, string>
    /** Called with 1 to `count` when a number is pressed (applies it at once). */
    onapply?: (n: number) => void
  }

  let {
    applied = 0,
    count = 4,
    numbers = 4,
    label = 'One Touch',
    orientation = 'horizontal',
    cells = false,
    hue = 'neutral',
    name,
    tipAction,
    onapply,
  }: Props = $props()

  const list = $derived(Array.from({ length: Math.max(0, numbers) }, (_, i) => i + 1))
  const spoken = $derived(
    name ??
      `One Touch Setting (OTS): ${applied ? `${applied} applied` : 'none applied'}. ` +
        'Click to apply; on the Launchkey, Shift + pads 9 to 12',
  )

  function tipOn(node: HTMLElement, key: string) {
    if (!tipAction) return
    return tipAction(node, key)
  }
</script>

{#snippet numberButtons()}
  {#each list as n (n)}
    <button
      type="button"
      class="number"
      class:cell={cells}
      class:applied={n === applied}
      disabled={n > count}
      aria-pressed={n === applied}
      aria-label={n === applied ? `One Touch ${n}, applied (Shift + pad ${n + 8})` : `Apply One Touch ${n} (Shift + pad ${n + 8})`}
      data-face={cells ? (n > count ? 'disabled' : n === applied ? 'on' : 'off') : n === applied ? 'chosen' : 'off'}
      data-hue={cells ? hue : undefined}
      style:--hue={cells ? `var(--${hue})` : undefined}
      style:--hue-absent={cells ? `var(--absent-${hue})` : undefined}
      data-tip="ots.{n}"
      use:tipOn={`ots.${n}`}
      onclick={() => onapply?.(n)}>{n}</button
    >
  {/each}
{/snippet}

{#if cells}
  <!-- Cells: the label and each number top-level, one a cell; the parent is the group. -->
  <span class="label cell">{label}</span>
  {@render numberButtons()}
{:else}
  <div class="ots" class:vertical={orientation === 'vertical'} role="group" aria-label={spoken}>
    <span class="label" aria-hidden="true">{label}</span>
    {@render numberButtons()}
  </div>
{/if}

<style>
  .ots {
    display: inline-flex;
    align-items: center;
    flex: none;
    height: var(--control-height-compact);
    white-space: nowrap;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .label {
    margin-right: var(--space-12);
    color: var(--caption-ink);
  }
  /* Vertical: the words on their own line, the numbers stacked under them, left-aligned with the
     words (each number keeps its tab padding, pulled back so its digit starts on the words' edge). */
  .vertical {
    flex-direction: column;
    align-items: flex-start;
    height: auto;
  }
  .vertical .label {
    margin: 0 0 var(--space-4);
    line-height: var(--control-height-compact);
  }
  .vertical .number {
    margin-left: calc(-1 * var(--tab-pad-side));
  }
  .number {
    height: var(--control-height-compact);
    margin: 0;
    padding: 0 var(--tab-pad-side);
    border: 0;
    border-radius: var(--radius);
    background: none;
    color: var(--tab-rest);
    font: inherit;
    letter-spacing: inherit;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .number:hover:not(:disabled) {
    color: var(--t);
  }
  .number.applied {
    color: var(--t);
    text-decoration: underline;
    text-decoration-thickness: var(--line-width);
    text-underline-offset: var(--space-4);
  }
  .number:disabled {
    color: var(--d);
    cursor: default;
  }
  /* Cells: each fills its parent's cell, centred, in the small text role (no wrapper sets it). */
  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-width: 0;
    margin: 0;
    white-space: nowrap;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  /* Cells: the label a plain caption flush left; each number a face in the state language (square,
     off a 1px inset outline and digit in the hue (--hue: `hue`, --neutral by default), on solid in
     it with --on-ink, disabled its absent strength). */
  .label.cell {
    justify-content: flex-start;
    color: var(--caption-ink);
  }
  .number.cell {
    padding: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--hue);
    color: var(--hue);
    text-decoration: none;
  }
  .number.cell[data-face='on'] {
    background: var(--hue);
    color: var(--on-ink);
  }
  .number.cell:disabled {
    box-shadow: inset 0 0 0 var(--outline-width) var(--hue-absent);
    color: var(--hue-absent);
  }
  .number:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--line-width));
  }
</style>
