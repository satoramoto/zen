<!--
  FaderCell: one strip as a Golden tree that grows like a stem. From the foot up, each node is one
  band, and the gaps between them (the internodes, fib steps) shrink toward the tip; the track
  takes everything the foot leaves (well over 61.8 % of a Stage strip):
    GoldenBand tab-block, top → [sound, …]                          (with `sound`)
      GoldenBand control-height, bottom, gap fib-8 → [lamp, …]      (with `lamp`)
        GoldenBand label-height, bottom, gap fib-5 → [name, …]
          GoldenBand label-height, bottom, gap fib-3 → [value, track]
  The track is the real Fader, its value moved out into the value band. The value and the name are
  one line each, centred, and end in an ellipsis when they don't fit, so the overlay reports them.
  `sound` (a button when `onsound` is set) puts the part's sound name on top, in the part's hue,
  centred and cut short with an ellipsis at the strip (the golden Stage's faders, Option C); `lamp` puts the strip's lamp at the foot. With `onopen`, the strip's name is
  the name button (opens Channel, with its marks).
  `kind="parked"`: an unused fader, narrow enough for half a live strip: no value, no sound text,
  the name "—" in the dim ink, and the Fader's parked look (with `empty`, a dotted ghost in the
  faded hue, no track: the golden Stage, so an absent fader looks absent, not live at zero).
  The cell fills the slot it is given, at any width (the Stage gives live strips twice a parked
  one's width). On its own (outside any Golden slot) it takes the size the Stage gives one fader.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { Action } from 'svelte/action'
  import Fader from '../Fader/Fader.svelte'
  import PartMarks from '../PartMarks/PartMarks.svelte'
  import GoldenBand from './GoldenBand.svelte'

  type Hue = 'r1' | 'r2' | 'r3' | 'l' | 'a' | 't2' | 't'

  type Props = {
    /** The fader's accessible name ("Right 1 · Stage Grand, level 90"). */
    name: string
    /** The strip's name under the fader ("Right 1", "R1 Piano"). */
    label: string
    /** The value step's text: the level ("90") or the layer and its value ("Rev 40"). Empty when parked. */
    value?: string
    /** The set level, 0–127: where the bracket's cap sits. */
    level?: number
    /** The left meter, 0–1 of the travel. */
    meter?: number
    /** The right meter, 0–1 of the travel. */
    meter2?: number
    /** The peak hold line, 0–1 of the travel. */
    peak?: number
    /** Where the hardware fader is (0–127) while it's away from the level. */
    away?: number
    /** `part`, `group`, `master` live; `off` a part switched off; `parked` an unused fader. */
    kind?: 'part' | 'group' | 'master' | 'off' | 'parked'
    /** The strip's colour token (without `--`). */
    hue?: Hue
    /** The non-Vol layer look (Pan, Reverb, Chorus, Delay): meters hidden, bracket and value white. */
    layered?: boolean
    /** With `kind="parked"`: a dotted ghost in the faded hue, no track (the Fader's `empty`), not the grey dashed groove. Off by default. */
    empty?: boolean
    /** The tooltip key, rendered as `data-tip`. */
    tip?: string
    /** The part's sound name on top of the strip ("Stage Grand"). Omitted (the default): no sound band. */
    sound?: string
    /** The sound button's accessible name ("Right 1 sound: Stage Grand. Opens the quick sound list"). */
    soundName?: string
    /** The sound button's tooltip key. */
    soundTip?: string
    /** Called when the sound is pressed (opens the part's sound list); without it the sound is plain text. */
    onsound?: () => void
    /**
     * The sound's lines: 1 (the default) cuts it short with an ellipsis on one line in a tab-block
     * band; 2 wraps it to two lines of the small text in a two-line band, cut short only after the
     * second (the golden Stage, designer pass).
     */
    soundLines?: 1 | 2
    /** Called when the strip's name is pressed (opens Channel); without it the name is plain text. */
    onopen?: () => void
    /** The name button's accessible name ("Right 1, Stage Grand: open Channel"). */
    openName?: string
    /** The name button's tooltip key. */
    openTip?: string
    /** The marks after the name: edited. */
    edited?: boolean
    /** The marks after the name: the plugin is missing. */
    missing?: boolean
    /** The marks after the name: the plugin failed. */
    failed?: boolean
    /** The strip's lamp (a LampButton or the page button), in a control-height band at the foot. Omitted: no lamp band. */
    lamp?: Snippet
    /** The app's `use:tip` action, applied with `tip` when both are set. */
    tipAction?: Action<HTMLElement, string>
    /** Called with the level asked for (0–127, whole). Not when parked. */
    onlevel?: (level: number) => void
    /** Draw the cell's cuts and check them (GoldenOverlay). */
    overlay?: boolean
  }

  let {
    name,
    label,
    value = '',
    level = 0,
    meter = 0,
    meter2 = 0,
    peak = 0,
    away,
    kind = 'part',
    hue = 't',
    layered = false,
    empty = false,
    tip,
    sound,
    soundName,
    soundTip,
    onsound,
    soundLines = 1,
    onopen,
    openName,
    openTip,
    edited = false,
    missing = false,
    failed = false,
    lamp,
    tipAction,
    onlevel,
    overlay = false,
  }: Props = $props()

  let ink = $derived(layered ? 't' : kind === 'off' ? 'd' : hue)
  let parked = $derived(kind === 'parked')
  let live = $derived(kind !== 'off' && !parked)
  /** The tree's outermost band, which draws the overlay when it's on. */
  let top = $derived(sound !== undefined ? 'sound' : lamp ? 'lamp' : 'stem')
  /** The name button's colour: the hue when live, its absent face when off (neutral hues have none). */
  let nameInk = $derived(
    live ? `var(--${hue})` : hue === 't' || hue === 't2' ? 'var(--absent-neutral)' : `var(--absent-${hue})`,
  )

  /** Applies the tooltip action to a button that has a key. */
  const tipped: Action<HTMLElement, string | undefined> = (node, key) => {
    if (!tipAction || key === undefined) return
    const handle = tipAction(node, key)
    return {
      update: (next) => {
        if (next !== undefined) handle?.update?.(next)
      },
      destroy: () => handle?.destroy?.(),
    }
  }
</script>

{#snippet stem()}
  <GoldenBand size="label-height" from="bottom" gap="fib-5" name="name" overlay={overlay && top === 'stem'}>
    {#if parked}
      <div class="text name" aria-hidden="true"><span class="rest">—</span></div>
    {:else if onopen}
      <div class="text name">
        <button
          type="button"
          class="open"
          style:--hue={nameInk}
          aria-label={openName ?? label}
          data-tip={openTip}
          use:tipped={openTip}
          onclick={() => onopen?.()}
        >
          <span class="tag">{label}</span>
          <PartMarks size="strip" {edited} {missing} {failed} />
        </button>
      </div>
    {:else}
      <div class="text name" aria-hidden="true"><span>{label}</span></div>
    {/if}
    <GoldenBand size="label-height" from="bottom" gap="fib-3" name="value">
      <div class="text value" aria-hidden="true">
        <span style:color="var(--{ink})">{parked ? '' : value}</span>
      </div>
      <div class="track">
        <Fader {name} value="" {level} {meter} {meter2} {peak} {away} {kind} {hue} {layered} {empty} {tip} {tipAction} {onlevel} />
      </div>
    </GoldenBand>
  </GoldenBand>
{/snippet}

{#snippet withLamp()}
  {#if lamp}
    <GoldenBand size="control-height" from="bottom" gap="fib-8" name="lamp" overlay={overlay && top === 'lamp'}>
      <div class="lamp">{@render lamp()}</div>
      {@render stem()}
    </GoldenBand>
  {:else}
    {@render stem()}
  {/if}
{/snippet}

<div class="cell" class:parked>
  {#if sound !== undefined}
    <GoldenBand size={soundLines === 2 ? 'label-lines-2' : 'tab-block'} from="top" name="sound" {overlay}>
      <div class="text sound" class:wrap={soundLines === 2} style:--hue={nameInk}>
        {#if parked}
          <span></span>
        {:else if onsound}
          <button
            type="button"
            class="sound-button"
            title={sound}
            data-golden-ellipsis
            aria-label={soundName ?? sound}
            data-tip={soundTip}
            use:tipped={soundTip}
            onclick={() => onsound?.()}
            >{#if soundLines === 2}<span class="lines">{sound}</span>{:else}{sound}{/if}</button
          >
        {:else}
          <span title={sound} data-golden-ellipsis>{sound}</span>
        {/if}
      </div>
      {@render withLamp()}
    </GoldenBand>
  {:else}
    {@render withLamp()}
  {/if}
</div>

<style>
  .cell {
    /* The Stage's faders block (the page frame's band, its major part across, inset fib-13, under
       its header), cut in nine: one fader cell, for a cell on its own. The page frame is the
       screen less its fib-21 margins; the band is its minor part less the keys' phi⁴ step. */
    --cell-frame: calc(var(--screen-width) - 2 * var(--fib-21));
    --cell-band: calc(var(--cell-frame) / var(--interval-phi2) * (1 - 1 / var(--interval-phi4)));
    /* The cell's cuts sit edge to edge: no inset inside it. */
    --golden-inset: 0px;
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
  /* On its own: the size of one fader cell on the Stage. */
  :global(:not([data-golden-slots])) > .cell {
    width: calc((var(--cell-frame) / var(--interval-phi) - 2 * var(--fib-13)) / 9);
    height: calc(var(--cell-band) - 2 * var(--fib-13) - var(--group-header-height));
  }

  /* The track: the Fader filling the rest of the stem, its value shown in the value band instead. */
  .track {
    container-type: size;
    --fader-height: 100cqh;
    --fader-value-height: 0px;
    --fader-travel-top: 0px;
  }

  .text {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .text span,
  .sound-button {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .value span {
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .name span {
    color: var(--t2);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  /* A parked strip's name: the rest mark, in the dim ink. */
  .name .rest {
    color: var(--d);
  }
  .name .tag {
    color: var(--hue);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .open {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    min-width: 0;
    max-width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  /* The sound: the small text in the part's hue (its absent face when off), centred on its own
     strip and ending in an ellipsis at the strip's edge, less a fib-3 each side, so two names
     never touch (the full name in the title, the tooltip). */
  .sound {
    box-sizing: border-box;
    padding: 0 var(--fib-3);
  }
  .sound span,
  .sound-button {
    color: var(--hue);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .sound-button {
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  /* `soundLines={2}`: the name wraps to two lines, centred over the strip (still a fib-3 in from
     each side), standing on the band's foot, and ends in an ellipsis only after the second line. */
  .sound.wrap {
    align-items: flex-end;
  }
  .sound.wrap > span,
  .sound.wrap .sound-button {
    max-width: calc(100% - 2 * var(--fib-3));
  }
  .sound.wrap .sound-button {
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .sound.wrap > span,
  .sound.wrap .lines {
    display: -webkit-box;
    min-width: 0;
    max-height: 100%;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    white-space: normal;
    overflow-wrap: break-word;
    text-align: center;
  }
  .sound-button:hover {
    color: var(--t);
  }
  .open:focus-visible,
  .sound-button:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--line-width));
  }
  /* The lamp fills its band. */
  .lamp {
    display: grid;
    container-type: size;
  }
  .lamp > :global(*) {
    width: 100%;
    min-width: 0;
  }
</style>
