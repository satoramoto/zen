<!--
  LampButton: the canvas's on/off control (Accomp, Metronome, part On, Sound, Looper), in the state
  language. Off is no fill, a 1px outline and the label in its hue (off keeps its colour); on is a
  solid fill in the hue with the label and code in --on-ink; waiting (armed) is a 2px ring over a
  faint fill of the hue; record draws on and waiting in record red; lime (`lamp`) lights in --lamp
  with --lamp-ink and outlines in --lamp-line; disabled is a 1px outline and
  the label in the lamp's own hue at reduced strength (its --absent-<hue>), no fill. No lamp is
  grey: the deprecated `m` draws exactly as the neutral `t`. Fully controlled: the face and aria-pressed follow `on` alone, and a click
  only asks for `!on` through ontoggle. Long press (and right-click) comes from the shared
  longpress action and never toggles.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import { longpress } from '../actions/longpress'

  type Props = {
    /** The word on the face. */
    label: string
    /** Lit (solid fill in its hue) or off. Controlled: a click asks for `!on` through `ontoggle` and changes nothing itself. */
    on?: boolean
    /** The hue of every face: `t` neutral (Accomp, Metronome, the function lamps), a part (`r1` `r2` `r3` `l`), `ok` green (Start / Stop), `lamp` lime (the Looper while looping or loop armed); disabled draws the same hue at reduced strength. `m` is a deprecated alias of `t` and draws exactly as it: no lamp is grey. */
    hue?: 't' | 'r1' | 'r2' | 'r3' | 'l' | 'ok' | 'lamp' | 'm'
    /** Small code after the label, e.g. `ACMP`. */
    code?: string
    /** Shown, not pressable: no toggle and no long press. Stays focusable. */
    disabled?: boolean
    /** Record lamp: lit, and waiting, draw in record red instead of `hue`. */
    rec?: boolean
    /** The waiting (armed) face while not on: a 2px ring and the label in the hue (record red with `rec`) over a faint fill of it. */
    waiting?: boolean
    /** `md` 32px tall (section row), `sm` 28px (settings rows), `cell` 32px filling its container (the band's lamp row). */
    size?: 'md' | 'sm' | 'cell'
    /** A fixed width in px, label centred, no side padding (e.g. 64 for the settings rows' On/Off). Wins over the size's width. */
    width?: number
    /** Joined to a neighbour: `start` on its right, `end` on its left (corners are square anyway). */
    join?: 'start' | 'end'
    /** The accessible name when the label alone isn't enough ("Right 1 on"). Default: label and code. */
    name?: string
    /** The tooltip key from `app/src/help/tooltips.ts` (e.g. `transport.acmp`), rendered as `data-tip`. */
    tip?: string
    /** The app's `use:tip` action, passed in by the wiring; applied with `tip` when both are set. */
    tipAction?: Action<HTMLElement, string>
    /** Called with the state asked for (`!on`) after a click, Space or Enter; not after a long press. */
    ontoggle?: (on: boolean) => void
    /** Called when the button is held for the long-press time, or right-clicked. */
    onlongpress?: () => void
    /** Called when the press that fired `onlongpress` ends. */
    onlongrelease?: () => void
  }

  let {
    label,
    on = false,
    hue = 't',
    code,
    disabled = false,
    rec = false,
    waiting = false,
    size = 'md',
    width,
    join,
    name,
    tip,
    tipAction,
    ontoggle,
    onlongpress,
    onlongrelease,
  }: Props = $props()

  /** The face as drawn: on (or record) > waiting > off. */
  let face = $derived(on ? (rec ? 'record' : 'on') : waiting ? 'waiting' : 'off')
  /** The hue drawn: record red when `rec` and not off; the deprecated grey `m` is the neutral `t`. */
  let drawn = $derived(rec && face !== 'off' ? 'rec' : hue === 'm' ? 't' : hue)

  /** Applies the parent's tooltip action when both it and a key are given. */
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

  function toggle() {
    if (disabled) return
    ontoggle?.(!on)
  }
</script>

<button
  type="button"
  class="lamp {size} face-{face}"
  class:fixed={width !== undefined}
  class:join-start={join === 'start'}
  class:join-end={join === 'end'}
  class:disabled
  style:width={width === undefined ? undefined : `${width}px`}
  data-face={disabled ? 'disabled' : face}
  data-hue={drawn}
  data-contrast={disabled ? 'dim' : undefined}
  data-tip={tip}
  aria-pressed={on}
  aria-disabled={disabled ? 'true' : undefined}
  aria-label={name ?? (code ? `${label} ${code}` : label)}
  onclick={toggle}
  use:tipped={tip}
  use:longpress={{ onlongpress, onlongrelease, disabled: disabled || onlongpress === undefined }}
>
  <span class="label">{label}{#if code}<span class="sub">{code}</span>{/if}</span>
</button>

<style>
  /* Each hue sets --hue (the rest outline and label, the on fill, the waiting ring and fill) and
     --hue-absent (the disabled outline and label: the same hue at reduced strength). */
  .lamp {
    --hue: var(--neutral);
    --hue-absent: var(--absent-neutral);
    /* The on fill and its label: the hue and --on-ink, except lime (its own fill and ink). */
    --hue-fill: var(--hue);
    --hue-ink: var(--on-ink);
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: var(--control-height);
    margin: 0;
    padding: 0 var(--space-16);
    border: 0;
    border-radius: var(--radius);
    /* Rest: no fill, a 1px inset outline (the box never changes size) and the label in the hue. */
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--hue);
    color: var(--hue);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    cursor: pointer;
  }
  .lamp[data-hue='r1'] {
    --hue: var(--r1);
    --hue-absent: var(--absent-r1);
  }
  .lamp[data-hue='r2'] {
    --hue: var(--r2);
    --hue-absent: var(--absent-r2);
  }
  .lamp[data-hue='r3'] {
    --hue: var(--r3);
    --hue-absent: var(--absent-r3);
  }
  .lamp[data-hue='l'] {
    --hue: var(--l);
    --hue-absent: var(--absent-l);
  }
  .lamp[data-hue='ok'] {
    --hue: var(--ok);
    --hue-absent: var(--absent-ok);
  }
  /* Lime: --lamp-line for the outline, label and ring on the ground (it passes AA there in light
     too); the lit face is --lamp with --lamp-ink. */
  .lamp[data-hue='lamp'] {
    --hue: var(--lamp-line);
    --hue-absent: var(--absent-lamp);
    --hue-fill: var(--lamp);
    --hue-ink: var(--lamp-ink);
  }
  .lamp[data-hue='rec'] {
    --hue: var(--rec);
    --hue-absent: var(--absent-rec);
  }
  .sm {
    height: var(--control-height-compact);
    padding: 0 var(--space-14);
  }
  .cell {
    width: 100%;
    min-width: 0;
    padding: 0;
  }
  .fixed {
    padding-right: 0;
    padding-left: 0;
  }
  .join-start {
    border-radius: var(--radius) 0 0 var(--radius);
  }
  .join-end {
    border-radius: 0 var(--radius) var(--radius) 0;
  }
  .label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* The small code: the label's colour at --code-opacity, full on a fill. */
  .sub {
    margin-left: var(--space-6);
    opacity: var(--code-opacity);
  }

  /* On (and record): a solid fill in the hue, the label and code in --on-ink (lime: --lamp, --lamp-ink). */
  .face-on,
  .face-record {
    background: var(--hue-fill);
    color: var(--hue-ink);
  }
  .face-on .sub,
  .face-record .sub {
    opacity: 1;
  }
  /* Waiting (armed): a 2px inset ring in the hue over a faint fill of it, drawn under the label. */
  .face-waiting {
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--hue);
  }
  .face-waiting::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--hue);
    opacity: var(--wait-fill-opacity);
  }

  /* Disabled: a 1px outline and the label in the hue at reduced strength, no fill, whatever the face. */
  .lamp.disabled {
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--hue-absent);
    color: var(--hue-absent);
    cursor: default;
  }
  .lamp.disabled::before {
    content: none;
  }
  .disabled .sub {
    opacity: 1;
  }
  .lamp:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
</style>
