<!--
  GoldenSteps: repeated cuts off the same side, each step smaller by the step interval. Each child
  takes the step's major part of what is left (r : 1 for interval r), the last child the remainder;
  biggest first. With phi: 61.8, 23.6, 14.6 % for three; the last two are always r : 1. Up to
  eight children. The step is the tuning's `steps` shape unless `step` names another.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import GoldenFrame from './GoldenFrame.svelte'
  import { ratioVar, type Fib, type GoldenReport, type Orient, type Ratio, type Side } from './golden'

  type Props = {
    /** The step interval; by default the tuning's `steps` shape (phi in the Phi tuning). */
    step?: Ratio
    /** The side the steps are cut from: the biggest sits there. */
    from?: Side
    /** Fit the steps themselves into their slot in this interval (contain); by default they fill it. */
    shape?: Ratio
    /** With `shape`: `wide` or `tall`. */
    orient?: Orient
    /** Padding inside each leaf, from the fib scale; nested primitives inherit it. */
    inset?: Fib
    /** What the overlay calls these steps in a report. */
    name?: string
    /** Draw the cuts over the steps and check them (GoldenOverlay). */
    overlay?: boolean
    /** With `overlay`: the report line under it. */
    report?: boolean
    /** With `overlay`: what the overlay finds, each time it changes. */
    onreport?: (report: GoldenReport) => void
    /** Drawn over all the steps, not in one. */
    over?: Snippet
    /** The steps' content, biggest first. */
    children?: Snippet
  }

  let {
    step = 'steps',
    from = 'top',
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

  let style = $derived(
    `--golden-step: ${ratioVar(step)}; ` +
      '--golden-major: calc(var(--golden-step) / (1 + var(--golden-step))); ' +
      '--golden-minor: calc(1 / (1 + var(--golden-step)))',
  )
</script>

<GoldenFrame
  kind="steps"
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
  attrs={{ 'data-from': from, 'data-step': step }}
/>
