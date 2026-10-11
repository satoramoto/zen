<!--
  GoldenFrame: the shell every Golden primitive renders (not used on its own). Three boxes:
  - the root fills its parent's slot and is a size container;
  - the fit is the root itself, or, with `shape`, the largest box of that interval that fits in it
    (contain), centred; it is a size container too, so the slots measure against it;
  - the slots hold the children, one slot each, in order. How they are cut is the primitive's
    (`kind` and `slotStyle`); the rules for each kind are below.
  Sizing is CSS only (container query units over the interval tokens). A direct child that isn't a
  Golden primitive is a leaf: it gets the `--golden-inset` padding (the nearest `inset`, inherited
  down the tree). `over` is drawn over all the slots, inset alike (the Stage's beat bar).
  With `overlay`, the frame is wrapped in a GoldenOverlay that draws its cuts and checks them.
  `spiralFrom` and `spiralTurn` orient the spiral the overlay draws in this node (its pole on the
  page's focus); they are written as `data-spiral-from` / `data-spiral-turn` on the slots element
  and change nothing in the layout.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import GoldenOverlay from './GoldenOverlay.svelte'
  import { fibVar, orientOf, ratioVar, type Fib, type GoldenReport, type Orient, type Ratio, type Side, type Turn } from './golden'

  type Props = {
    /** The primitive: what the slots element is marked with, and which rules cut it. */
    kind: 'box' | 'cut' | 'steps' | 'spiral' | 'row' | 'column' | 'grid'
    /** Fit the frame into its slot in this interval (contain), instead of filling it. */
    shape?: Ratio
    /** The fitted box's turn; a shape's own by default (a knob and a fader stand tall). */
    orient?: Orient
    /** Padding inside each leaf slot, from the fib scale; nested primitives inherit it. */
    inset?: Fib
    /** What the overlay calls this node in a report. */
    name?: string
    /** The slots element's inline style: the cut, as CSS over the tokens. */
    slotStyle?: string
    /** Extra data attributes on the slots element (the side, a row's check). */
    attrs?: Record<string, string | undefined>
    /** The side the overlay's spiral in this node starts from; its default rule when absent. */
    spiralFrom?: Side
    /** Which way the overlay's spiral in this node turns (`ccw` when absent). */
    spiralTurn?: Turn
    /** Draw the cuts over this frame (a GoldenOverlay around it). */
    overlay?: boolean
    /** With `overlay`: the report under it. */
    report?: boolean
    /** With `overlay`: called with what the overlay finds, each time it changes. */
    onreport?: (report: GoldenReport) => void
    /** Drawn over all the slots, not in one. */
    over?: Snippet
    /** The slots' content: each direct child fills the next slot. */
    children?: Snippet
  }

  let {
    kind,
    shape,
    orient,
    inset,
    name,
    slotStyle,
    attrs = {},
    spiralFrom,
    spiralTurn,
    overlay = false,
    report = false,
    onreport,
    over,
    children,
  }: Props = $props()

  let tall = $derived(shape !== undefined && orientOf(shape, orient) === 'tall')
</script>

{#snippet frame()}
  <div class="golden-root" data-golden={kind} data-golden-name={name} style:--golden-inset={inset ? fibVar(inset) : undefined}>
    <div
      class="golden-fit"
      class:shaped={shape !== undefined}
      class:tall
      data-golden-fit
      data-shape={shape}
      data-orient={shape !== undefined ? (tall ? 'tall' : 'wide') : undefined}
      style:--golden-fit={shape ? ratioVar(shape) : undefined}
    >
      <div
        class="golden-slots"
        data-golden-slots={kind}
        style={slotStyle}
        data-spiral-from={spiralFrom}
        data-spiral-turn={spiralTurn}
        {...attrs}
      >
        {@render children?.()}
      </div>
      {#if over}
        <div class="golden-over">{@render over()}</div>
      {/if}
    </div>
  </div>
{/snippet}

{#if overlay}
  <GoldenOverlay {report} {onreport}>{@render frame()}</GoldenOverlay>
{:else}
  {@render frame()}
{/if}

<style>
  .golden-root {
    display: grid;
    place-items: center;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    container-type: size;
  }
  .golden-fit {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    container-type: size;
  }
  /* Contain: the widest box of the interval that fits, its height from the ratio. */
  .golden-fit.shaped {
    width: min(100cqw, calc(100cqh * var(--golden-fit)));
    height: auto;
    aspect-ratio: var(--golden-fit) / 1;
  }
  .golden-fit.shaped.tall {
    width: min(100cqw, calc(100cqh / var(--golden-fit)));
    aspect-ratio: 1 / var(--golden-fit);
  }
  .golden-slots {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
  }
  .golden-over {
    position: absolute;
    inset: 0;
    padding: var(--golden-inset, 0);
    container-type: size;
    pointer-events: none;
  }
  .golden-over > :global(*) {
    pointer-events: auto;
  }

  /* Every slot: no minimum from its content (so content too big for it overflows, and the overlay
     sees it); a leaf gets the inset. */
  .golden-slots > :global(*) {
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
  }
  .golden-slots > :global(:not([data-golden])) {
    padding: var(--golden-inset, 0);
  }

  /* box: one slot, the whole fit. */
  .golden-slots[data-golden-slots='box'] {
    display: grid;
    grid-template: 100% / 100%;
  }
  .golden-slots[data-golden-slots='box'] > :global(*) {
    grid-area: 1 / 1;
  }

  /* cut (GoldenSplit, GoldenBand): the first child takes --golden-take off the `from` side, the
     second gets the rest. */
  .golden-slots[data-golden-slots='cut'],
  .golden-slots[data-golden-slots='steps'] {
    display: flex;
  }
  .golden-slots[data-from='top'] {
    flex-direction: column;
  }
  .golden-slots[data-from='bottom'] {
    flex-direction: column-reverse;
  }
  .golden-slots[data-from='left'] {
    flex-direction: row;
  }
  .golden-slots[data-from='right'] {
    flex-direction: row-reverse;
  }
  .golden-slots[data-golden-slots='cut'] > :global(*) {
    flex: 1 1 0;
  }
  .golden-slots[data-golden-slots='cut'] > :global(:first-child) {
    flex: 0 0 var(--golden-take);
  }

  /* steps: each child takes the step's major part of what is left (`--golden-major`, r / (1 + r));
     the last gets the remainder. Up to eight steps. */
  .golden-slots[data-golden-slots='steps'] > :global(:nth-child(1)) {
    flex: 0 0 calc(100% * var(--golden-major));
  }
  .golden-slots[data-golden-slots='steps'] > :global(:nth-child(2)) {
    flex: 0 0 calc(100% * var(--golden-major) * var(--golden-minor));
  }
  .golden-slots[data-golden-slots='steps'] > :global(:nth-child(3)) {
    flex: 0 0 calc(100% * var(--golden-major) * var(--golden-minor) * var(--golden-minor));
  }
  .golden-slots[data-golden-slots='steps'] > :global(:nth-child(4)) {
    flex: 0 0 calc(100% * var(--golden-major) * var(--golden-minor) * var(--golden-minor) * var(--golden-minor));
  }
  .golden-slots[data-golden-slots='steps'] > :global(:nth-child(5)) {
    flex: 0 0
      calc(100% * var(--golden-major) * var(--golden-minor) * var(--golden-minor) * var(--golden-minor) * var(--golden-minor));
  }
  .golden-slots[data-golden-slots='steps'] > :global(:nth-child(6)) {
    flex: 0 0
      calc(
        100% * var(--golden-major) * var(--golden-minor) * var(--golden-minor) * var(--golden-minor) * var(--golden-minor) *
          var(--golden-minor)
      );
  }
  .golden-slots[data-golden-slots='steps'] > :global(:nth-child(7)) {
    flex: 0 0
      calc(
        100% * var(--golden-major) * var(--golden-minor) * var(--golden-minor) * var(--golden-minor) * var(--golden-minor) *
          var(--golden-minor) * var(--golden-minor)
      );
  }
  .golden-slots[data-golden-slots='steps'] > :global(*:last-child) {
    flex: 1 1 0;
  }

  /* spiral: each child at its own place (--golden-s1 … --golden-s8, an `inset` each); the last at
     the remainder left after the squares before it (--golden-r1 … --golden-r8). */
  .golden-slots[data-golden-slots='spiral'] {
    position: relative;
  }
  .golden-slots[data-golden-slots='spiral'] > :global(*) {
    position: absolute;
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(1)) {
    inset: var(--golden-s1);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(2)) {
    inset: var(--golden-s2);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(3)) {
    inset: var(--golden-s3);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(4)) {
    inset: var(--golden-s4);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(5)) {
    inset: var(--golden-s5);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(6)) {
    inset: var(--golden-s6);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(7)) {
    inset: var(--golden-s7);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(1):last-child) {
    inset: var(--golden-r1);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(2):last-child) {
    inset: var(--golden-r2);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(3):last-child) {
    inset: var(--golden-r3);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(4):last-child) {
    inset: var(--golden-r4);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(5):last-child) {
    inset: var(--golden-r5);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(6):last-child) {
    inset: var(--golden-r6);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(7):last-child) {
    inset: var(--golden-r7);
  }
  .golden-slots[data-golden-slots='spiral'] > :global(:nth-child(8):last-child) {
    inset: var(--golden-r8);
  }

  /* row, column: one track per cell, each its interval of the cross size (the style). Cells that
     don't add up leave spare or overflow, and the overlay draws the row red. */
  .golden-slots[data-golden-slots='row'] {
    display: grid;
    grid-template-rows: 100%;
    grid-auto-flow: column;
    grid-auto-columns: 0;
  }
  .golden-slots[data-golden-slots='column'] {
    display: grid;
    grid-template-columns: 100%;
    grid-auto-flow: row;
    grid-auto-rows: 0;
  }

  /* grid: equal cells, or weighted columns (--golden-tracks, from `weights`); with a cell shape,
     each child is fitted into its cell (contain). */
  .golden-slots[data-golden-slots='grid'] {
    display: grid;
    grid-template-columns: repeat(var(--golden-columns), minmax(0, 1fr));
    grid-template-rows: repeat(var(--golden-rows), minmax(0, 1fr));
  }
  .golden-slots[data-golden-slots='grid'][data-weights] {
    grid-template-columns: var(--golden-tracks);
  }
  .golden-slots[data-golden-slots='grid'][data-cell] > :global(*) {
    place-self: center;
    width: min(calc(100cqw / var(--golden-columns)), calc(100cqh / var(--golden-rows) * var(--golden-cell)));
    aspect-ratio: var(--golden-cell) / 1;
  }
  .golden-slots[data-golden-slots='grid'][data-cell][data-orient='tall'] > :global(*) {
    width: min(calc(100cqw / var(--golden-columns)), calc(100cqh / var(--golden-rows) / var(--golden-cell)));
    aspect-ratio: 1 / var(--golden-cell);
  }
</style>
