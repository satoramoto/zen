<!--
  Display: the Stage's 1392 × 300 display, "Poster, in thirds": three equal columns on the ground,
  calm and big, and one thin beat bar under all three.
  - Left, harmony: the style line (‹ style › and its category · metre), the chord at the hero
    size, the chord's notes and the fingering.
  - Middle, song: the playing section, what comes next and when, the tempo with + and −.
  - Right, parts: one row per keyboard part, then One Touch 1-4.
  Exactly three type sizes: the chord (--type-hero and its step-downs), the section and the tempo
  (--type-poster), and --type-text for every other word. No boxes inside the display: its
  controls are plain text and glyphs that brighten on hover (the band keeps its outlines).
  Data comes in as each region's props; every press comes back through the callbacks here.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import type { Action } from 'svelte/action'
  import BarBeat from '../BarBeat/BarBeat.svelte'
  import ChordReadout from '../ChordReadout/ChordReadout.svelte'
  import NowPlaying from '../NowPlaying/NowPlaying.svelte'
  import SoundRow from '../SoundRow/SoundRow.svelte'
  import StyleLine from '../StyleLine/StyleLine.svelte'

  type StyleLineProps = ComponentProps<typeof StyleLine>
  type SoundRowProps = ComponentProps<typeof SoundRow>
  type NowPlayingProps = ComponentProps<typeof NowPlaying>
  /** A region's data: its props without `tipAction` and the `on…` callbacks. */
  type Data<P> = {
    [K in keyof P as K extends 'tipAction'
      ? never
      : K extends `on${string}`
        ? NonNullable<P[K]> extends (...args: never[]) => unknown
          ? never
          : K
        : K]: P[K]
  }

  type Props = {
    /** The style line: style, category, time signature, queued style; and One Touch (drawn in the right third). */
    styleLine: Data<StyleLineProps> & {
      /** The applied One Touch, 1-4; 0 when none is. */
      oneTouch?: number
      /** How many One Touch settings the style has (numbers past it are disabled). */
      oneTouchCount?: number
    }
    /** Now playing: the chord (left third), the section and tempo (middle), and the beat (the beat bar). */
    nowPlaying: Data<NowPlayingProps> & {
      /** The chord readout: chord, extension, notes, fingering, held. */
      chord: ComponentProps<typeof ChordReadout>
      /** The current beat, 1-based; 0 when stopped. */
      beat?: number
      /** Beats in the bar (the time signature's): one segment each in the beat bar. */
      beats?: number
      /** Unused: kept so callers that pass it still type-check. */
      progress?: number
    }
    /** The parts: one row per keyboard part. */
    soundRow: Pick<Data<SoundRowProps>, 'parts'>
    /** The app's tooltip action (`use:tip`), applied to every control. */
    tipAction?: Action<HTMLElement, string>
    /** ‹: the previous style. */
    onprev?: StyleLineProps['onprev']
    /** ›: the next style. */
    onnext?: StyleLineProps['onnext']
    /** The style's name: opens Library › Styles. */
    onbrowse?: StyleLineProps['onbrowse']
    /** One Touch 1-4: applies it. */
    ononetouch?: SoundRowProps['ononetouch']
    /** Tempo + held (`true`) and released (`false`); from the keyboard, a press calls with `true` then `false`. */
    ontempoup?: NowPlayingProps['ontempoup']
    /** Tempo − held and released, as `ontempoup`. */
    ontempodown?: NowPlayingProps['ontempodown']
    /** The tempo number double-clicked: back to the style's own tempo. */
    onstyletempo?: NowPlayingProps['onstyletempo']
    /** A drag, scroll or arrow key on the tempo number asks for this tempo. */
    ontempo?: NowPlayingProps['ontempo']
    /** A part's row: opens its sound list. */
    onsound?: SoundRowProps['onsound']
  }

  let {
    styleLine,
    nowPlaying,
    soundRow,
    tipAction,
    onprev,
    onnext,
    onbrowse,
    ononetouch,
    ontempoup,
    ontempodown,
    onstyletempo,
    ontempo,
    onsound,
  }: Props = $props()

  const style = $derived({
    styleName: styleLine.styleName,
    category: styleLine.category,
    timeSignature: styleLine.timeSignature,
    queued: styleLine.queued,
  })
  const song = $derived({
    playing: nowPlaying.playing,
    hue: nowPlaying.hue,
    next: nowPlaying.next,
    fill: nowPlaying.fill,
    bar: nowPlaying.bar,
    bars: nowPlaying.bars,
    bpm: nowPlaying.bpm,
    running: nowPlaying.running,
    syncStart: nowPlaying.syncStart,
  })
</script>

<section class="display" aria-label="Stage display">
  <div class="thirds">
    <div class="third harmony">
      <StyleLine {...style} {tipAction} {onprev} {onnext} {onbrowse} />
      <div class="chord"><ChordReadout {...nowPlaying.chord} tip="fingering.select" {tipAction} /></div>
    </div>
    <div class="third song">
      <NowPlaying {...song} {tipAction} {ontempoup} {ontempodown} {onstyletempo} {ontempo} />
    </div>
    <div class="third parts">
      <SoundRow
        parts={soundRow.parts}
        oneTouch={styleLine.oneTouch}
        oneTouchCount={styleLine.oneTouchCount}
        {tipAction}
        {onsound}
        {ononetouch}
      />
    </div>
  </div>
  <div class="beat">
    <BarBeat
      beat={nowPlaying.running ? (nowPlaying.beat ?? 0) : 0}
      beats={nowPlaying.beats ?? 4}
      hue={nowPlaying.hue}
    />
  </div>
</section>

<style>
  .display {
    position: relative;
    box-sizing: border-box;
    width: var(--stage-row-width);
    height: var(--display-height);
    border: var(--display-border-width) solid transparent;
    background: var(--backdrop-ground);
    overflow: hidden;
  }
  /* Three equal columns inside the display's padding, above the beat bar. */
  .thirds {
    position: absolute;
    top: var(--display-pad-top);
    left: var(--display-pad-left);
    right: var(--display-pad-left);
    bottom: calc(var(--display-pad-bottom) + var(--space-24));
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    /* The three thirds share one row, centred (by default) in the space above the beat bar. */
    align-content: var(--display-thirds-align);
    gap: var(--display-thirds-gap);
  }
  .third {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .chord {
    margin-top: var(--display-chord-gap);
  }
  /* The middle third's section lines up with the chord (by default): below a style line's height. */
  .song {
    padding-top: var(--display-song-top);
  }
  .beat {
    position: absolute;
    left: var(--display-pad-left);
    right: var(--display-pad-left);
    bottom: var(--display-pad-bottom);
  }
</style>
