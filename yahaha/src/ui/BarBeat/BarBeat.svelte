<!--
  BarBeat: the display's beat bar, one thin line under all three thirds, a segment per beat of the
  bar (the time signature's beats) in the playing section's hue: past beats solid, the current beat
  lit (taller, with the hue's glow), beats to come dim. Stopped (`beat` 0): every segment dim. The
  parent passes the moment; nothing here moves on its own. A readout, not a control: one spoken
  name, the segments hidden.
-->
<script lang="ts">
  type Hue = 'intro' | 'main' | 'ending' | 'brk' | 'fill'

  type Props = {
    /** The current beat, 1-based; 0 when stopped (every segment dim). */
    beat?: number
    /** Beats in the bar: one segment each. */
    beats?: number
    /** The playing section's hue. */
    hue?: Hue
  }

  let { beat = 0, beats = 4, hue = 'main' }: Props = $props()

  const segments = $derived(Array.from({ length: Math.max(1, beats) }, (_, i) => i + 1))
  const spoken = $derived(beat > 0 ? `Beat ${beat} of ${beats}` : 'Stopped')

  function state(n: number): 'past' | 'current' | 'future' {
    if (beat <= 0) return 'future'
    if (n === beat) return 'current'
    return n < beat ? 'past' : 'future'
  }
</script>

<div
  class="beats"
  role="img"
  aria-label={spoken}
  style:--hue="var(--{hue})"
  style:--glow="var(--beat-glow-{hue})"
  style:--beats={segments.length}
  data-hue={hue}
>
  {#each segments as n (n)}
    <span class="segment {state(n)}" data-state={state(n)} aria-hidden="true"></span>
  {/each}
</div>

<style>
  .beats {
    display: grid;
    grid-template-columns: repeat(var(--beats), minmax(0, 1fr));
    gap: var(--space-8);
    align-items: center;
    /* The display's content width, at most its container. */
    width: calc(var(--stage-row-width) - 2 * var(--display-border-width) - 2 * var(--display-pad-left));
    max-width: 100%;
    height: var(--bar-segment-height);
  }
  .segment {
    height: var(--bar-line);
    background: var(--bar-rest);
  }
  .segment.past {
    background: var(--hue);
  }
  .segment.current {
    height: var(--bar-segment-height);
    background: var(--hue);
    box-shadow: var(--glow);
  }
</style>
