<!--
  GoldenBox: a box in one shape (an interval or a control's shape), fitted (contain) into its
  parent's slot and centred: the largest box of that interval that fits. Its children share its one
  slot. A knob's or a fader's shape stands tall; any interval can be turned with `orient`.
  `spiralFrom` and `spiralTurn` orient the spiral the overlay draws in a phi box (so its pole sits
  on the page's focus); without them the overlay's rule holds (from the left, or the top when tall,
  ccw). They change nothing in the layout.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import GoldenFrame from './GoldenFrame.svelte'
  import type { Fib, GoldenReport, Orient, Ratio, Side, Turn } from './golden'

  type Props = {
    /** The box's interval, or a control's shape (`knob`, `fader`, …: the tuning decides it). */
    shape: Ratio
    /** `wide` (width over height) or `tall`; a shape's own by default (a knob and a fader stand tall). */
    orient?: Orient
    /** Padding inside each leaf, from the fib scale (`fib-13`); nested primitives inherit it. */
    inset?: Fib
    /** What the overlay calls this box in a report. */
    name?: string
    /** The side the overlay's spiral starts from (a phi box); the overlay's rule when absent. */
    spiralFrom?: Side
    /** Which way the overlay's spiral turns: `ccw` (left, bottom, right, top; the default) or `cw`. */
    spiralTurn?: Turn
    /** Draw the cuts over this box and check them (GoldenOverlay). */
    overlay?: boolean
    /** With `overlay`: the report line under it. */
    report?: boolean
    /** With `overlay`: what the overlay finds, each time it changes. */
    onreport?: (report: GoldenReport) => void
    /** Drawn over the box, not in its slot. */
    over?: Snippet
    /** The box's content. */
    children?: Snippet
  }

  let { shape, orient, inset, name, spiralFrom, spiralTurn, overlay = false, report = false, onreport, over, children }: Props = $props()
</script>

<GoldenFrame kind="box" {shape} {orient} {inset} {name} {spiralFrom} {spiralTurn} {overlay} {report} {onreport} {over} {children} />
