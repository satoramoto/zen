<!--
  GoldenSpiral: repeated square cuts, turning (left, bottom, right, top, …), in a wide phi box
  fitted into its slot. Each child but the last takes the next square, biggest first; the last
  child gets the remainder. Up to eight children.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import GoldenFrame from './GoldenFrame.svelte'
  import { spiralSlots, type Fib, type GoldenReport, type Rect } from './golden'

  type Props = {
    /** Padding inside each leaf, from the fib scale; nested primitives inherit it. */
    inset?: Fib
    /** What the overlay calls this spiral in a report. */
    name?: string
    /** Draw the cuts and the spiral over it and check them (GoldenOverlay). */
    overlay?: boolean
    /** With `overlay`: the report line under it. */
    report?: boolean
    /** With `overlay`: what the overlay finds, each time it changes. */
    onreport?: (report: GoldenReport) => void
    /** Drawn over the whole spiral, not in one slot. */
    over?: Snippet
    /** The squares' content, biggest first; the last child fills the remainder. */
    children?: Snippet
  }

  let { inset, name, overlay = false, report = false, onreport, over, children }: Props = $props()

  const MAX = 8
  /** A rectangle (fractions of the box) as an `inset` value. */
  const asInset = (r: Rect) =>
    [r.y, 1 - r.x - r.w, 1 - r.y - r.h, r.x].map((v) => `${(Math.max(0, v) * 100).toFixed(4)}%`).join(' ')

  // Square k is the same whatever follows it; the remainder depends on how many squares came before.
  const squares = spiralSlots(MAX).slice(0, MAX - 1)
  const STYLE = [
    ...squares.map((r, i) => `--golden-s${i + 1}: ${asInset(r)}`),
    ...Array.from({ length: MAX }, (_, i) => `--golden-r${i + 1}: ${asInset(spiralSlots(i + 1)[i])}`),
  ].join('; ')
</script>

<GoldenFrame kind="spiral" shape="phi" orient="wide" {inset} {name} {overlay} {report} {onreport} {over} {children} slotStyle={STYLE} />
