<!--
  SoundRow: the display's right third, the parts and One Touch. One row per keyboard part: a dot
  in the part's hue (its absent strength when the part is off), the sound's name with its marks
  (edited ●, plugin ⚠ or ✕), and the part's name at the right ("Right 3 · off", "Left · bass").
  Each row is one plain control, no box: it brightens on hover, shows the focus ring on keyboard
  focus, and a click asks for that part's sound list through `onsound`. Under the rows, One Touch
  1-4 (OneTouchPicker). Every word is the one small size (--type-text).
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import OneTouchPicker from '../OneTouchPicker/OneTouchPicker.svelte'
  import { marksText } from '../PartMarks/marks'
  import PartMarks from '../PartMarks/PartMarks.svelte'

  type PartId = 'right1' | 'right2' | 'right3' | 'left'

  type Part = {
    /** Which part. */
    id: PartId
    /** Its short name ("R1"). Spoken only. */
    part?: string
    /** Its full name ("Right 1"), at the row's right. */
    partName: string
    /** Its hue: the dot. */
    hue: 'r1' | 'r2' | 'r3' | 'l'
    /** The sound's number in its list. Spoken only. */
    number?: string
    /** The sound's name. */
    sound: string
    /** The part is off: the dot at its absent strength, the name muted, "· off" after the part. */
    off?: boolean
    /** The sound was changed since it was loaded: the ● mark. */
    edited?: boolean
    /** The part's plugin isn't installed: the ⚠ mark. */
    missing?: boolean
    /** The part's plugin failed: the ✕ mark. */
    failed?: boolean
    /** The part plays the Style's bass: "· bass" after the part. */
    bass?: boolean
  }

  type Props = {
    /** The four keyboard parts, in order. */
    parts: Part[]
    /** The applied One Touch, 1-4; 0 when none is. */
    oneTouch?: number
    /** How many One Touch settings the style has: numbers past it are disabled. */
    oneTouchCount?: number
    /** Draws One Touch under the rows. False when the layout shows One Touch on its own (the golden Stage). */
    showOneTouch?: boolean
    /** The app's tooltip action (`use:tip`), applied to every control. */
    tipAction?: Action<HTMLElement, string>
    /** Called with the part's id when its row is pressed (opens its sound list). */
    onsound?: (id: PartId) => void
    /** Called with 1-4 when a One Touch is pressed (applies it at once). */
    ononetouch?: (n: number) => void
  }

  let { parts, oneTouch = 0, oneTouchCount = 4, showOneTouch = true, tipAction, onsound, ononetouch }: Props = $props()

  /** The words after the part's name: "off" when off and not playing the bass, "bass" when it does. */
  const tail = (p: Part) => (p.bass ? ' · bass' : p.off ? ' · off' : '')

  function tipOn(node: HTMLElement, key: string) {
    if (!tipAction) return
    return tipAction(node, key)
  }
</script>

<div class="parts">
  <ul class="rows">
    {#each parts as p (p.id)}
      <li>
        <button
          type="button"
          class="row"
          class:off={p.off && !p.bass}
          style:--hue="var(--{p.hue})"
          style:--hue-off="var(--absent-{p.hue})"
          aria-label="{p.partName} sound: {p.number ? `${p.number} ` : ''}{p.sound}{marksText(p)}. Opens the quick sound list"
          data-tip="launchkey.fader_sound"
          use:tipOn={'launchkey.fader_sound'}
          onclick={() => onsound?.(p.id)}
        >
          <span class="dot" aria-hidden="true"></span>
          <span class="sound" aria-hidden="true"
            ><span class="name">{p.sound}</span><PartMarks edited={p.edited} missing={p.missing} failed={p.failed} /></span
          >
          <span class="part" aria-hidden="true">{p.partName}{tail(p)}</span>
        </button>
      </li>
    {/each}
  </ul>
  {#if showOneTouch}
    <div class="ots">
      <OneTouchPicker applied={oneTouch} count={oneTouchCount} {tipAction} onapply={ononetouch} />
    </div>
  {/if}
</div>

<style>
  /* A third of the display's content width (Display's grid), at most its container. */
  .parts {
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: calc((var(--stage-row-width) - 2 * var(--display-border-width) - 2 * var(--display-pad-left) - 2 * var(--display-thirds-gap)) / 3);
    max-width: 100%;
    font-family: var(--font-sans);
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    width: 100%;
    height: var(--control-height-compact);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--radius);
    background: none;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .row:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
  .dot {
    flex: none;
    width: var(--beat-dot);
    height: var(--beat-dot);
    border-radius: 50%;
    background: var(--hue);
  }
  .sound {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-8);
    color: var(--t2);
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .part {
    flex: none;
    color: var(--m);
  }
  .row:hover .sound {
    color: var(--t);
  }
  .row:hover .part {
    color: var(--t2);
  }
  .off .dot {
    background: var(--hue-off);
  }
  .off .sound {
    color: var(--m);
  }
  .ots {
    margin-top: var(--space-8);
    display: flex;
  }
</style>
