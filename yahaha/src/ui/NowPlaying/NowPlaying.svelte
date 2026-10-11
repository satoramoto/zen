<!--
  NowPlaying: the display's middle third, the song. The playing section large in its hue (muted,
  without its glow, while stopped); under it one small line: what comes next and when ("then Main D
  · fill after bar 4"), "bar 3 of 4" when nothing is queued, or stopped "Stopped" / "Sync Start
  armed" (and the armed Intro). Below, the tempo at the section's size with Tempo + and − stacked
  at its right (TempoReadout). Two sizes only: the section and the tempo share --type-poster,
  every other word is --type-text. Holds no state and no timers: the parent repeats Tempo ±
  between the two hold calls. `show` draws one of the three alone, its container's width, for a
  Golden layout that gives each its own cell.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import SectionName from '../SectionName/SectionName.svelte'
  import TempoReadout from '../TempoReadout/TempoReadout.svelte'

  type Hue = 'intro' | 'main' | 'ending' | 'brk' | 'fill'

  type Props = {
    /** The playing section's shown name ("Main C"); stopped, the section the band starts on. */
    playing: string
    /** The playing section's hue. */
    hue?: Hue
    /** The next (queued or armed) section's shown name ("Main D"). Empty: none. */
    next?: string
    /** When the change lands ("fill after bar 4", "after bar 4", "next beat"). Empty: nothing. */
    fill?: string
    /** The current bar of the section, 1-based: "bar 3 of 4" when nothing is queued. */
    bar?: number
    /** Bars in the section. */
    bars?: number
    /** The tempo in BPM. */
    bpm: number
    /** The band is running. False: the section muted, "Stopped" on the small line. */
    running?: boolean
    /** Stopped with Sync Start armed: "Sync Start armed" on the small line. */
    syncStart?: boolean
    /**
     * What to draw: `all` (the section, the small line and the tempo, a third of the display
     * wide), or one of them alone, `section`, `next` (the small line) or `tempo`, filling its
     * container's width with no top margin, so a Golden layout can give each its own cell.
     */
    show?: 'all' | 'section' | 'next' | 'tempo'
    /** The app's tooltip action (`use:tip`), applied to the tempo's controls. */
    tipAction?: Action<HTMLElement, string>
    /** Tempo + held (`true`) and released (`false`); from the keyboard, a press calls with `true` then `false`. */
    ontempoup?: (down: boolean) => void
    /** Tempo − held and released, as `ontempoup`. */
    ontempodown?: (down: boolean) => void
    /** The tempo number double-clicked: back to the style's own tempo. */
    onstyletempo?: () => void
    /** A drag, scroll or arrow key on the tempo number asks for this tempo. */
    ontempo?: (bpm: number) => void
  }

  let {
    playing,
    hue = 'main',
    next = '',
    fill = '',
    bar = 0,
    bars = 0,
    bpm,
    running = false,
    syncStart = false,
    show = 'all',
    tipAction,
    ontempoup,
    ontempodown,
    onstyletempo,
    ontempo,
  }: Props = $props()

  const then = $derived(next.trim() ? `then ${next}` : '')
  const line = $derived.by(() => {
    if (!running) return [syncStart ? 'Sync Start armed' : 'Stopped', then].filter(Boolean).join(' · ')
    const parts = [then, fill].filter(Boolean)
    if (parts.length === 0 && bar > 0 && bars > 0) return `bar ${bar} of ${bars}`
    return parts.join(' · ')
  })

  /** The block's spoken name, for what it shows. */
  const NAMES = { all: 'Section and tempo', section: 'Section', next: 'Next section', tempo: 'Tempo' } as const
</script>

<div class="song" class:alone={show !== 'all'} role="group" aria-label={NAMES[show]}>
  {#if show === 'all' || show === 'section'}
  <div class="section">
    <SectionName label={playing} {hue} idle={!running} />
  </div>
  {/if}
  {#if show === 'all' || show === 'next'}
  <p class="line" class:sync={!running && syncStart}>{line}</p>
  {/if}
  {#if show === 'all' || show === 'tempo'}
  <div class="tempo">
    <TempoReadout
      {bpm}
      {tipAction}
      {ontempo}
      onplus={ontempoup}
      onminus={ontempodown}
      onreset={onstyletempo}
    />
  </div>
  {/if}
</div>

<style>
  /* A third of the display's content width (Display's grid), at most its container. */
  .song {
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: calc((var(--stage-row-width) - 2 * var(--display-border-width) - 2 * var(--display-pad-left) - 2 * var(--display-thirds-gap)) / 3);
    max-width: 100%;
    font-family: var(--font-sans);
  }
  .section {
    display: flex;
    min-width: 0;
    overflow: hidden;
  }
  .line {
    margin: var(--space-6) 0 0;
    min-height: var(--label-height);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    color: var(--t2);
  }
  .line.sync {
    color: var(--ok);
  }
  .tempo {
    margin-top: var(--now-tempo-gap);
    display: flex;
  }
  /* One part alone (`show`): its container's width, no top margin. */
  .song.alone {
    width: 100%;
  }
  .alone .line,
  .alone .tempo {
    margin-top: 0;
  }
</style>
