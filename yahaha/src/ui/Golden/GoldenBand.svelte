<!--
  GoldenBand: the only way out of the ratios. It takes a band off one side, as deep as an existing
  size token (a header row, a hit target, the keys), never a raw px; the rest of the box keeps
  its proportions. Two children: the band, then the rest. `gap` keeps a fib step between them.
  `times` scales the token by an interval (the golden Stage's controls row: `size="control-height"
  times="phi"`, 32 × phi = 52), so a band one golden step deeper than a token is still named.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import GoldenFrame from './GoldenFrame.svelte'
  import { fibVar, ratioVar, type BandSize, type Fib, type GoldenReport, type Interval, type Side } from './golden'

  type Props = {
    /** The band's depth: an existing size token (`bar-height`, `group-header-height`, `control-height`, `keys-height`, …). */
    size: BandSize
    /** The side the band is taken from. */
    from?: Side
    /** The token scaled by this interval (`phi`: one golden step deeper); unscaled when absent. */
    times?: Interval
    /** A fib step between the band and the rest. */
    gap?: Fib
    /** Padding inside each leaf, from the fib scale; nested primitives inherit it. */
    inset?: Fib
    /** What the overlay calls this band in a report. */
    name?: string
    /** Draw the cuts over the band and check them (GoldenOverlay). */
    overlay?: boolean
    /** With `overlay`: the report line under it. */
    report?: boolean
    /** With `overlay`: what the overlay finds, each time it changes. */
    onreport?: (report: GoldenReport) => void
    /** Drawn over the band and the rest, not in one. */
    over?: Snippet
    /** Two children: the band, then the rest. */
    children?: Snippet
  }

  let { size, from = 'top', times, gap, inset, name, overlay = false, report = false, onreport, over, children }: Props = $props()
</script>

<GoldenFrame
  kind="cut"
  {inset}
  {name}
  {overlay}
  {report}
  {onreport}
  {over}
  {children}
  slotStyle={`--golden-take: ${times ? `calc(var(--${size}) * ${ratioVar(times)})` : `var(--${size})`}${gap ? `; gap: ${fibVar(gap)}` : ''}`}
  attrs={{ 'data-from': from, 'data-band': size, 'data-times': times }}
/>
