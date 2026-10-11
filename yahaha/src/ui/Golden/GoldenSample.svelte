<!--
  GoldenSample: one Golden primitive on its own, its slots filled with numbered leaves, under a
  GoldenOverlay with its report: the Golden/Primitives stories. Every primitive's props are here, so
  each can be tried from the controls; the ones a primitive doesn't take are ignored.
-->
<script lang="ts">
  import GoldenBand from './GoldenBand.svelte'
  import GoldenBox from './GoldenBox.svelte'
  import GoldenColumn from './GoldenColumn.svelte'
  import GoldenGrid from './GoldenGrid.svelte'
  import GoldenOverlay from './GoldenOverlay.svelte'
  import GoldenRow from './GoldenRow.svelte'
  import GoldenSpiral from './GoldenSpiral.svelte'
  import GoldenSplit from './GoldenSplit.svelte'
  import GoldenSteps from './GoldenSteps.svelte'
  import type { BandSize, Cell, Fib, GoldenReport, Interval, Orient, Ratio, Side, Take, Turn } from './golden'

  type Props = {
    /** The primitive shown. */
    primitive: 'box' | 'split' | 'steps' | 'spiral' | 'row' | 'column' | 'grid' | 'band'
    /** How many leaves to fill it with (a split and a band take two; a row and a column one per cell). */
    count?: number
    /** GoldenBox's shape; for the others, fit the primitive itself in this interval. */
    shape?: Ratio
    /** With `shape`: `wide` or `tall`. */
    orient?: Orient
    /** GoldenSplit: what is taken. */
    take?: Take
    /** GoldenSplit, GoldenSteps, GoldenBand: the side cut from. */
    from?: Side
    /** GoldenSteps: the step interval. */
    step?: Ratio
    /** GoldenRow, GoldenColumn: one interval per cell. */
    cells?: Cell[]
    /** GoldenGrid: cells across. */
    columns?: number
    /** GoldenGrid: cells down. */
    rows?: number
    /** GoldenGrid: fit each leaf to this shape. */
    cell?: Ratio
    /** GoldenGrid: each column's share, an interval each (then `columns` and `cell` are ignored). */
    weights?: Interval[]
    /** GoldenBox, GoldenSplit: the side the overlay's spiral cuts its first square off. */
    spiralFrom?: Side
    /** GoldenBox, GoldenSplit: the way the overlay's spiral turns. */
    spiralTurn?: Turn
    /** GoldenBand: the token the band is sized by. */
    size?: BandSize
    /** GoldenBand: the token scaled by this interval. */
    times?: Interval
    /** GoldenSplit: the strip holds this many boxes of its interval side by side. */
    boxes?: number
    /** GoldenBand, GoldenSplit: the fib step between the part taken and the rest. */
    gap?: Fib
    /** The leaves' inset, from the fib scale. */
    inset?: Fib
    /** What the overlay finds, each time it changes. */
    onreport?: (report: GoldenReport) => void
  }

  let {
    primitive,
    count = 3,
    shape,
    orient,
    take = 'square',
    from = 'top',
    step,
    cells = ['unison', 'phi'],
    columns = 3,
    rows = 2,
    cell,
    weights,
    spiralFrom,
    spiralTurn,
    size ='group-header-height',
    times,
    boxes,
    gap,
    inset,
    onreport,
  }: Props = $props()

  let n = $derived(
    primitive === 'split' || primitive === 'band'
      ? 2
      : primitive === 'row' || primitive === 'column'
        ? cells.length
        : primitive === 'grid'
          ? (weights?.length || columns) * rows
          : primitive === 'box'
            ? 1
            : Math.max(1, Math.min(8, Math.round(count))),
  )
  let leaves = $derived(Array.from({ length: n }, (_, i) => i + 1))
</script>

{#snippet fill()}
  {#each leaves as i (i)}
    <div class="leaf"><span>{i}</span></div>
  {/each}
{/snippet}

<GoldenOverlay report {onreport}>
  {#if primitive === 'box'}
    <GoldenBox shape={shape ?? 'phi'} {orient} {inset} {spiralFrom} {spiralTurn} name="box">{@render fill()}</GoldenBox>
  {:else if primitive === 'split'}
    <GoldenSplit {take} {from} {boxes} {gap} {shape} {orient} {inset} {spiralFrom} {spiralTurn} name="split">{@render fill()}</GoldenSplit>
  {:else if primitive === 'steps'}
    <GoldenSteps {step} {from} {shape} {orient} {inset} name="steps">{@render fill()}</GoldenSteps>
  {:else if primitive === 'spiral'}
    <GoldenSpiral {inset} name="spiral">{@render fill()}</GoldenSpiral>
  {:else if primitive === 'row'}
    <GoldenRow {cells} {shape} {orient} {inset} name="row">{@render fill()}</GoldenRow>
  {:else if primitive === 'column'}
    <GoldenColumn {cells} {shape} {orient} {inset} name="column">{@render fill()}</GoldenColumn>
  {:else if primitive === 'grid'}
    <GoldenGrid {columns} {rows} {cell} {weights} {shape} {orient} {inset} name="grid">{@render fill()}</GoldenGrid>
  {:else}
    <GoldenBand {size} {from} {times} {gap} {inset} name="band">{@render fill()}</GoldenBand>
  {/if}
</GoldenOverlay>

<style>
  .leaf {
    display: grid;
    place-items: center;
    overflow: hidden;
    color: var(--m);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
</style>
