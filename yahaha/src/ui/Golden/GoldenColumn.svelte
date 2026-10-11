<!--
  GoldenColumn: GoldenRow turned: children stacked, each as tall as the column is wide times its
  cell's interval (`phi`, or `1:phi` for the inverse). The cells must add up to the column's box;
  if they don't, they leave spare or overflow, and the overlay draws the column red. With `shape`,
  the column is fitted into its slot in that interval and checked against it from the names alone.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import GoldenFrame from './GoldenFrame.svelte'
  import { addsUp, cellTrack, type Cell, type Fib, type GoldenReport, type Orient, type Ratio } from './golden'

  type Props = {
    /** One interval per child, top to bottom: its height over the column's width (`1:phi` for width over phi). */
    cells: Cell[]
    /** The column's own box: fitted into its slot (contain), and what the cells must add up to. A column's box is usually `tall`. */
    shape?: Ratio
    /** With `shape`: `wide` or `tall` (default `tall`). */
    orient?: Orient
    /** Padding inside each leaf, from the fib scale; nested primitives inherit it. */
    inset?: Fib
    /** What the overlay calls this column in a report. */
    name?: string
    /** Draw the cuts over the column and check them (GoldenOverlay). */
    overlay?: boolean
    /** With `overlay`: the report line under it. */
    report?: boolean
    /** With `overlay`: what the overlay finds, each time it changes. */
    onreport?: (report: GoldenReport) => void
    /** Drawn over the whole column, not in one cell. */
    over?: Snippet
    /** The cells' content, top to bottom. */
    children?: Snippet
  }

  let { cells, shape, orient = 'tall', inset, name, overlay = false, report = false, onreport, over, children }: Props = $props()

  let check = $derived(addsUp(cells, shape))
</script>

<GoldenFrame
  kind="column"
  {shape}
  {orient}
  {inset}
  name={name ?? 'column'}
  {overlay}
  {report}
  {onreport}
  {over}
  {children}
  slotStyle={`grid-template-rows: ${cells.map((cell) => cellTrack(cell, 'cqw')).join(' ')}`}
  attrs={{ 'data-golden-adds': check ? (check.adds ? 'yes' : 'no') : undefined, 'data-golden-sum': check?.sum.toFixed(4) }}
/>
