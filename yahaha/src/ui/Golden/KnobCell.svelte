<!--
  KnobCell: one band knob as a Golden tree that fills the slot it is given (no fit to a shape, so
  no spare). The dial grows to fill its cell: its tree is two label-height bands off the foot (a
  line of text is a fixed token) and the dial in everything they leave:
    GoldenBand label-height, bottom → [name, GoldenBand label-height, bottom → [value, dial]]
  - the dial: the real Knob drawn as its ring alone, as big as the rest allows (its height, or its
    width less a fib-3 gutter, whichever is smaller), centred across, standing on the value;
  - the value, tight under the dial; the name under it.
  One line each: when the full name doesn't fit its cell (measured once the cell has a size), the
  knob's short code ("RtgRate") is shown instead and the full name goes in the title (the tooltip);
  a name is never cut short while its code fits. With `lines={2}` the name's band is two lines
  deep and a long name wraps onto the second line (the same 13px size); the code only when two
  lines don't hold it (the golden Stage: a readable name over a cryptic code). With `valueInside`
  the value sits in the ring's hollow and the dial takes its band:
    GoldenBand label-lines-2 (or label-height), bottom → [name, dial with the value inside]
  With `shorten="word"` the stand-in for a name that doesn't fit is a human short name, its first
  word ("Retrig"), never the code (the golden Stage).
  Inside a grid fitted to a cell shape, the grid sizes it. On its own (outside any Golden slot) it
  takes the size the Stage gives one knob cell.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Knob from '../Knob/Knob.svelte'
  import GoldenBand from './GoldenBand.svelte'

  type Props = {
    /** The plain name ("Dynamics", "Retrig rate"). For an unused knob, the board's "---". */
    label: string
    /** The Genos code ("DynCtrl"): spoken, and shown in place of the name when the name doesn't fit. */
    code?: string
    /** The value as shown ("127", "1/8", "Off"). */
    value?: string
    /** A small unit after the value ("%"). */
    unit?: string
    /** How far round the arc is, 0–1 of its 270°. */
    fraction?: number
    /** Nothing is mapped to this knob: dim name, an empty ring, no value. */
    unused?: boolean
    /** The tooltip key, rendered as `data-tip`. */
    tip?: string
    /** The app's `use:tip` action, applied with `tip` when both are set. */
    tipAction?: Action<HTMLElement, string>
    /** Called on a click that didn't turn the knob, Space or Enter. */
    onpress?: () => void
    /** Called with the steps turned (positive: clockwise). Not when unused. */
    onstep?: (delta: number) => void
    /**
     * The name's lines. 1 (the default): one line, the short code when the name doesn't fit. 2: a
     * band two lines deep (the same 13px size), the name wrapping onto the second line where it
     * doesn't fit one; the short code only when two lines don't hold it.
     */
    lines?: 1 | 2
    /**
     * The value inside the ring's hollow (centred in it) instead of in its own band under the dial,
     * so the dial grows into that band. Off (the default): the value tight under the dial.
     */
    valueInside?: boolean
    /**
     * What stands in for a name that doesn't fit: `code` (the default), the knob's Genos code
     * ("RtgRate"); `word`, a human short name, the name's first word ("Retrig rate" → "Retrig"),
     * never cut short with a full stop, so no cryptic code is shown (the golden Stage). A one-word
     * name that doesn't fit stays whole: its cell needs the room. The full name is in the title
     * either way. `ellipsis`: no stand-in; the name and the value each one line, cut short with an
     * ellipsis a fib-8 short of the cell (half each side), the full name always in the title (the
     * golden Stage, designer pass).
     */
    shorten?: 'code' | 'word' | 'ellipsis'
    /**
     * The dial's size. `fill` (the default): as big as the cell allows, less a fib-3 gutter. `phi`:
     * the cell's width over phi (or its height, if less), so the gutter between two dials falls out
     * of the ratio, and the name and value lines keep a fib-5 between neighbours (the golden
     * Stage: every knob cell one width, assigned or not). `fib`: as big as the cell allows less a
     * fib-13 gutter (its height, or its width less the fib-13, whichever is smaller), the name and
     * value lines a fib-5 short of their neighbours (the golden Stage, round 8: the cell over phi
     * left the dials small).
     */
    dial?: 'fill' | 'phi' | 'fib'
    /** Draw the cell's cuts and check them (GoldenOverlay). */
    overlay?: boolean
  }

  let {
    label,
    code = '',
    value = '',
    unit = '',
    fraction = 0,
    unused = false,
    tip,
    tipAction,
    onpress,
    onstep,
    lines = 1,
    valueInside = false,
    shorten = 'code',
    dial = 'fill',
    overlay = false,
  }: Props = $props()

  /** The name's stand-in when it doesn't fit: the code, or the name's first word. Empty: none (the name stays). */
  let brief = $derived.by(() => {
    if (shorten === 'code') return code
    if (shorten === 'ellipsis') return ''
    const word = label.trim().split(/\s+/)[0] ?? ''
    return word === label.trim() ? '' : word
  })

  /** `shorten="ellipsis"`: the name and value cut short with an ellipsis, the full name in the title. */
  let clamp = $derived(shorten === 'ellipsis')

  /** Knob's own spoken name: the value is shown in its own band, so the dial carries none. */
  let spoken = $derived(unused ? 'unused' : `${label}${code ? ` (${code})` : ''} ${value}${unit}`)

  /** The name's band, and the full name set out of sight on one line, to measure it against the band. */
  let box = $state<HTMLElement>()
  let measure = $state<HTMLElement>()
  /** The full name is wider than its band: show the short code. False where nothing is laid out (jsdom). */
  let short = $state(false)
  /** What stands in for the name when it is short: `brief`. */
  let stand = $state('')

  $effect(() => {
    const band = box
    const full = measure
    if (!band || !full || typeof ResizeObserver === 'undefined') return
    // Re-measured when the name or code changes (the effect reads them).
    void label
    const alt = brief
    const two = lines === 2
    const fit = () => {
      const style = getComputedStyle(band)
      const room = band.getBoundingClientRect().width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      // No stand-in (a one-word name under `word`): the name stays whole, never cut short with a
      // full stop (round 8: "Dynamic." read as a failure), so a name that doesn't fit shows as
      // overflow and its cell gets the room instead.
      if (alt === '' || room <= 0) {
        short = false
        return
      }
      // Two lines: the name, wrapped at the band's width, is deeper than the band, or one of its
      // words is wider than it. One line: the name is wider than the band.
      short = two
        ? full.offsetHeight > band.clientHeight + 1 || full.scrollWidth > band.clientWidth + 1
        : full.getBoundingClientRect().width > room
      stand = alt
    }
    const observer = new ResizeObserver(fit)
    observer.observe(band)
    fit()
    let live = true
    document.fonts?.ready.then(() => live && fit())
    return () => {
      live = false
      observer.disconnect()
    }
  })
</script>

<div class="cell" class:phi={dial === 'phi'} class:fib={dial === 'fib'} class:clamp={clamp} lang="en">
  <GoldenBand size={lines === 2 ? 'label-lines-2' : 'label-height'} from="bottom" name="knob" {overlay}>
    <div
      class="text name"
      class:unused
      class:two={lines === 2}
      bind:this={box}
      title={short || clamp ? label : undefined}
      aria-hidden="true"
    >
      <span data-golden-ellipsis={clamp || undefined}>{short ? stand : label}</span>
      <span class="probe"><span class="measure" bind:this={measure}>{label}</span></span>
    </div>
    {#if valueInside}
      <!-- The value inside the ring's hollow: the dial takes the value's band too. -->
      <div class="dial inside">
        <Knob {label} {code} value="" unit="" {fraction} {unused} name={spoken} {tip} {tipAction} {onpress} {onstep} />
        <span class="ring-value" class:unused aria-hidden="true">{unused ? '' : value}{unused ? '' : unit}</span>
      </div>
    {:else}
      <GoldenBand size="label-height" from="bottom">
        <div class="text value" class:unused aria-hidden="true">
          <span data-golden-ellipsis={clamp || undefined}>{unused ? '' : value}{unused ? '' : unit}</span>
        </div>
        <div class="dial">
          <Knob {label} {code} value="" unit="" {fraction} {unused} name={spoken} {tip} {tipAction} {onpress} {onstep} />
        </div>
      </GoldenBand>
    {/if}
  </GoldenBand>
</div>

<style>
  .cell {
    /* The Stage's knobs block (half the page frame across, round 8; the band's minor part deep,
       inset fib-13, under its header), cut in eight: one knob cell, for a cell on its own. The
       page frame is the screen less its fib-21 margins; the band is the frame's minor part less
       the keys' phi⁴ step. A cell inside a Golden tree has no inset of its own. */
    --golden-inset: 0px;
    --cell-frame: calc(var(--screen-width) - 2 * var(--fib-21));
    --cell-band: calc(var(--cell-frame) / var(--interval-phi2) * (1 - 1 / var(--interval-phi4)));
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
  /* In a grid fitted to a cell shape, the grid sizes the cell (its width and aspect ratio). */
  :global([data-golden-slots][data-cell]) > .cell {
    height: auto;
  }
  /* On its own: the size of one knob cell on the Stage. */
  :global(:not([data-golden-slots])) > .cell {
    width: calc((var(--cell-frame) / var(--interval-octave) - 2 * var(--fib-13)) / 8);
    height: calc(var(--cell-band) / var(--interval-phi2) - 2 * var(--fib-13) - var(--group-header-height));
  }

  /* The dial: the Knob's ring alone, as big as the rest allows (a fib-3 gutter to its neighbours),
     centred across and standing on the value, so the value sits tight under it; its label and
     code take no room. */
  .dial {
    display: grid;
    place-items: end center;
    container-type: size;
    --knob-ring: max(0px, min(100cqh, 100cqw - var(--fib-3)));
    --knob-height: var(--knob-ring);
    --knob-ring-gap: 0px;
    --knob-label-height: 0px;
    --knob-value-height: 0px;
    --knob-text-max: 0px;
    --knob-text-overflow: hidden;
  }

  /* `phi`: the dial is the cell's width over phi (its height if less), so two dials side by side
     keep a gutter of the cell's golden minor; the name and value lines stop a fib-5 short of their
     neighbours (half each side). */
  .phi .dial {
    --knob-ring: max(0px, min(100cqh, 100cqw / var(--interval-phi)));
  }
  /* `fib`: as big as the cell allows, a fib-13 gutter between two dials. */
  .fib .dial {
    --knob-ring: max(0px, min(100cqh, 100cqw - var(--fib-13)));
  }
  .phi .text,
  .fib .text {
    padding-inline: calc(var(--fib-5) / 2);
  }
  /* `shorten="ellipsis"`: the name and value lines a fib-8 short of the cell (half each side). */
  .clamp .text {
    padding-inline: calc(var(--fib-8) / 2);
  }

  /* The value inside the ring: one grid cell with the Knob, as big as the ring, standing on the
     dial's foot as the ring does; the pointer goes through to the Knob. */
  .dial.inside > :global(*) {
    grid-area: 1 / 1;
  }
  .ring-value {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--knob-ring);
    height: var(--knob-ring);
    overflow: hidden;
    pointer-events: none;
    color: var(--a);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .text {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    overflow: hidden;
    text-align: center;
  }
  .text span {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  /* The full name on one line, out of sight and out of the flow, in a box of no size that clips
     it (so the band never reports it as overflow): only measured. */
  .text .probe {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    overflow: hidden;
    visibility: hidden;
  }
  .text .measure {
    display: block;
    width: max-content;
    max-width: none;
    overflow: visible;
  }
  /* Two lines: the name hangs from the value line and wraps once (same size, one size a line); the
     probe is the band's width, so the measure wraps as the name would. */
  .text.two {
    align-items: flex-start;
  }
  .text.two > span:first-child {
    white-space: normal;
    text-overflow: clip;
  }
  .text.two .probe {
    width: 100%;
  }
  .text.two .measure {
    width: auto;
    white-space: normal;
  }
  .value span {
    color: var(--a);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .name span {
    color: var(--t2);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .name.unused span {
    color: var(--d);
  }
</style>
