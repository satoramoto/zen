<!--
  GoldenRow: children side by side, each as wide as the row is tall times its cell's interval
  (`phi`, or `1:phi` for the inverse). The cells must add up to the row's box: the Stage's display
  row is square, square, 1:phi, 1:phi, square = phi³. Cells that don't add up are laid out at their
  true size anyway, leaving spare or overflowing, and the overlay draws the row red. With `shape`,
  the row is fitted into its slot in that interval and checked against it from the names alone (so
  a story can assert it without layout).
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import GoldenFrame from './GoldenFrame.svelte'
  import { addsUp, cellTrack, type Cell, type Fib, type GoldenReport, type Orient, type Ratio } from './golden'

  type Props = {
    /** One interval per child, left to right: its width over the row's height (`1:phi` for height over phi). */
    cells: Cell[]
    /** The row's own box: fitted into its slot (contain), and what the cells must add up to. */
    shape?: Ratio
    /** With `shape`: `wide` or `tall`. */
    orient?: Orient
    /** Padding inside each leaf, from the fib scale; nested primitives inherit it. */
    inset?: Fib
    /** What the overlay calls this row in a report. */
    name?: string
    /** Draw the cuts over the row and check them (GoldenOverlay). */
    overlay?: boolean
    /** With `overlay`: the report line under it. */
    report?: boolean
    /** With `overlay`: what the overlay finds, each time it changes. */
    onreport?: (report: GoldenReport) => void
    /** Drawn over the whole row, not in one cell (the Stage's beat bar). */
    over?: Snippet
    /** The cells' content, left to right. */
    children?: Snippet
  }

  let { cells, shape, orient, inset, name, overlay = false, report = false, onreport, over, children }: Props = $props()

  let check = $derived(addsUp(cells, shape))
</script>

<GoldenFrame
  kind="row"
  {shape}
  {orient}
  {inset}
  name={name ?? 'row'}
  {overlay}
  {report}
  {onreport}
  {over}
  {children}
  slotStyle={`grid-template-columns: ${cells.map((cell) => cellTrack(cell, 'cqh')).join(' ')}`}
  attrs={{ 'data-golden-adds': check ? (check.adds ? 'yes' : 'no') : undefined, 'data-golden-sum': check?.sum.toFixed(4) }}
/>
