<!--
  GoldenGrid: equal cells, `columns` × `rows`, filled in reading order. With `cell`, each child is
  fitted into its cell in that interval or shape (contain, centred): eight knobs in a row each keep
  the knob's shape whatever the row's size, and the room left over is spare.
  With `weights`, the columns are weighted instead: one per weight, each its interval's share of the
  width (`['octave', 'unison']`: a live fader strip twice a parked one's width); rows stay equal.
  `cell` (and `cellOrient`) is ignored when `weights` is set.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import GoldenFrame from './GoldenFrame.svelte'
  import { orientOf, ratioVar, weightTracks, type Fib, type GoldenReport, type Interval, type Orient, type Ratio } from './golden'

  type Props = {
    /** Cells across. Ignored when `weights` is set (the columns are `weights.length`). */
    columns?: number
    /** Weighted columns: each column's share of the width as an interval. Overrides `columns`; `cell` is ignored with it. */
    weights?: Interval[]
    /** Cells down. */
    rows?: number
    /** Fit each child into its cell in this interval or shape (contain); by default a child fills its cell. */
    cell?: Ratio
    /** With `cell`: the cells' turn; a shape's own by default. */
    cellOrient?: Orient
    /** Fit the grid itself into its slot in this interval (contain); by default it fills the slot. */
    shape?: Ratio
    /** With `shape`: `wide` or `tall`. */
    orient?: Orient
    /** Padding inside each leaf, from the fib scale; nested primitives inherit it. */
    inset?: Fib
    /** What the overlay calls this grid in a report. */
    name?: string
    /** Draw the cuts over the grid and check them (GoldenOverlay). */
    overlay?: boolean
    /** With `overlay`: the report line under it. */
    report?: boolean
    /** With `overlay`: what the overlay finds, each time it changes. */
    onreport?: (report: GoldenReport) => void
    /** Drawn over the whole grid, not in one cell. */
    over?: Snippet
    /** The cells' content, in reading order. */
    children?: Snippet
  }

  let {
    columns = 1,
    weights,
    rows = 1,
    cell: cellProp,
    cellOrient,
    shape,
    orient,
    inset,
    name,
    overlay = false,
    report = false,
    onreport,
    over,
    children,
  }: Props = $props()

  /** The weights when there are any; then `cell` is ignored. */
  let weighted = $derived(weights && weights.length > 0 ? weights : undefined)
  let cell = $derived(weighted ? undefined : cellProp)
  let style = $derived(
    `--golden-columns: ${weighted ? weighted.length : Math.max(1, Math.round(columns))}; --golden-rows: ${Math.max(1, Math.round(rows))}` +
      (weighted ? `; --golden-tracks: ${weightTracks(weighted)}` : '') +
      (cell ? `; --golden-cell: ${ratioVar(cell)}` : ''),
  )
</script>

<GoldenFrame
  kind="grid"
  {shape}
  {orient}
  {inset}
  {name}
  {overlay}
  {report}
  {onreport}
  {over}
  {children}
  slotStyle={style}
  attrs={{
    'data-cell': cell,
    'data-orient': cell ? orientOf(cell, cellOrient) : undefined,
    'data-weights': weighted?.join(' '),
  }}
/>
