<!--
  GoldenSplit: one cut. It takes a part off one side of its box (`from`): a square (as deep as the
  box is across), the golden section's `major` (61.8 % of the length) or `minor` (38.2 %), or a
  strip in an interval (as deep as the box is across over the interval). Two children: the part
  taken, then the rest. A square taken off a box that is too short for it overflows, and the
  overlay draws it red.
  `spiralFrom` and `spiralTurn` orient the spiral the overlay draws in this split (so its pole sits
  on the page's focus): a `major`/`minor` split's spiral otherwise starts from `from` and turns ccw,
  and with `spiralFrom` set any split gets a spiral, whatever it takes. They change nothing in the
  layout.
  `boxes` (with an interval `take` of the cross size) makes the strip as deep as that many boxes of
  the interval laid side by side across it: the golden Stage's display is three phi boxes across
  the frame (`take="phi" boxes={3}`), its pads two rows of eight 6:5 pads (`take="minor-third"
  boxes={4}`). `gap` keeps a fib step between the part taken and the rest (as GoldenBand's).
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import GoldenFrame from './GoldenFrame.svelte'
  import { fibVar, ratioVar, type Fib, type GoldenReport, type Orient, type Ratio, type Side, type Take, type Turn } from './golden'

  type Props = {
    /** What is taken: `square`, `major`, `minor`, or an interval or shape (a strip that deep: the box's width over it). */
    take?: Take
    /** The side it is taken from. */
    from?: Side
    /**
     * What an interval `take` divides: the box's `cross` size (a strip as deep as the box is across
     * over the interval; the default) or its `length` (a step: the length over the interval, so
     * `take="phi4" of="length"` is a phi⁴ step, the cut a bar takes off a half's outer edge).
     * `square`, `major` and `minor` ignore it.
     */
    of?: 'cross' | 'length'
    /**
     * With an interval `take` of the cross size: the strip holds this many boxes of the interval
     * side by side (its depth the cross size over the interval times `boxes`). 1 when absent.
     */
    boxes?: number
    /** A fib step between the part taken and the rest. */
    gap?: Fib
    /** Fit the split itself into its slot in this interval (contain); by default it fills the slot. */
    shape?: Ratio
    /** With `shape`: `wide` or `tall`. */
    orient?: Orient
    /** Padding inside each leaf, from the fib scale; nested primitives inherit it. */
    inset?: Fib
    /** What the overlay calls this split in a report. */
    name?: string
    /** The side the overlay's spiral starts from; `from` when absent. Set, any split gets a spiral. */
    spiralFrom?: Side
    /** Which way the overlay's spiral turns: `ccw` (left, bottom, right, top; the default) or `cw`. */
    spiralTurn?: Turn
    /** Draw the cuts over this split and check them (GoldenOverlay). */
    overlay?: boolean
    /** With `overlay`: the report line under it. */
    report?: boolean
    /** With `overlay`: what the overlay finds, each time it changes. */
    onreport?: (report: GoldenReport) => void
    /** Drawn over both parts, not in one. */
    over?: Snippet
    /** Two children: the part taken, then the rest. */
    children?: Snippet
  }

  let {
    take = 'square',
    from = 'top',
    of = 'cross',
    boxes,
    gap,
    shape,
    orient,
    inset,
    name,
    spiralFrom,
    spiralTurn,
    overlay = false,
    report = false,
    onreport,
    over,
    children,
  }: Props = $props()

  /** The cross size: the box's width for a cut from the top or bottom, its height from a side. */
  let cross = $derived(from === 'top' || from === 'bottom' ? '100cqw' : '100cqh')
  let size = $derived(
    take === 'square'
      ? cross
      : take === 'major'
        ? 'calc(100% / var(--interval-phi))'
        : take === 'minor'
          ? 'calc(100% / var(--interval-phi2))'
          : of === 'length'
            ? `calc(100% / ${ratioVar(take)})`
            : boxes !== undefined && boxes !== 1
              ? `calc(${cross} / (${ratioVar(take)} * ${boxes}))`
              : `calc(${cross} / ${ratioVar(take)})`,
  )
</script>

<GoldenFrame
  kind="cut"
  {shape}
  {orient}
  {inset}
  {name}
  {spiralFrom}
  {spiralTurn}
  {overlay}
  {report}
  {onreport}
  {over}
  {children}
  slotStyle={`--golden-take: ${size}${gap ? `; gap: ${fibVar(gap)}` : ''}`}
  attrs={{ 'data-from': from, 'data-take': take, 'data-of': of, 'data-boxes': boxes !== undefined ? String(boxes) : undefined }}
/>
