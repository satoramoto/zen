<!--
  Button: does one thing when pressed (Panic, Stop, a page step, a One Touch), in the state
  language: at rest a 1px outline and label in its hue, no fill; on or chosen a solid fill in the
  hue with the label in --on-ink; waiting a 2px ring over a faint fill of the hue; disabled a 1px
  outline and the label in its own hue at reduced strength (--absent-<hue>), no fill. No button is
  grey: the deprecated `t2` and `m` draw exactly as the neutral `t`. Every face comes from props (precedence chosen, on, waiting, off);
  it holds no state of its own. Glyphs are the fixed
  `symbol` list. Long press comes from the shared longpress action; `hold` reports pointer down
  and up through onhold for the parent's repeat (Tempo ±). No timers.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import { longpress } from '../actions/longpress'

  type Glyph = 'prev' | 'next' | 'up' | 'down' | 'plus' | 'minus' | 'caret'
  type Hue =
    | 't'
    | 't2'
    | 'm'
    | 'a'
    | 'lamp'
    | 'rec'
    | 'ok'
    | 'r1'
    | 'r2'
    | 'r3'
    | 'l'
    | 'intro'
    | 'main'
    | 'ending'
    | 'brk'
    | 'fill'

  type Props = {
    /** The word or character on the face ("Panic", "Stop", "1", "?"). May be empty when `symbol` is set. */
    label?: string
    /** A glyph after the label, or alone: ◀ ▶ ▲ ▼ + − ▾. Hidden from assistive tech. */
    symbol?: Glyph
    /** `icon` 32 × 32; `md` width from the label; `band` 88 wide, left-aligned; `pair` 41 wide; `cell` fills its container; `caret` the 20 × 32 ▾. */
    size?: 'icon' | 'md' | 'band' | 'pair' | 'cell' | 'caret'
    /** Kept for compatibility; changes nothing (every label is the one small control type). */
    compact?: boolean
    /** Kept for compatibility; changes nothing (the rest face's label is already in its hue). */
    strong?: boolean
    /** Start / Stop running, `band` only. `true`: the on face in `--ok` (solid green, `--on-ink` label), marked `data-bar`. `false` or undefined: the face the other props give. */
    bar?: boolean
    /** The on face: switched on (help mode's ?, Fade while fading), a solid fill in `hue`. */
    on?: boolean
    /** The chosen face: the one picked from a set (the applied One Touch), a solid fill in `hue`. */
    chosen?: boolean
    /** The waiting face: queued or armed, a 2px ring over a faint fill of `hue`. */
    waiting?: boolean
    /** The colour token (without `--`) of every face: the rest outline and label, the on and chosen fill, the waiting ring; disabled draws the same hue at reduced strength. `t` draws in `--neutral`, `lamp` in `--lamp-line`. `t2` and `m` are deprecated aliases of `t` and draw exactly as it: no button is grey. */
    hue?: Hue
    /** Sets `aria-pressed` for a switch or a choice. Undefined: no `aria-pressed`. Never changes the look. */
    pressed?: boolean
    /** Sets `aria-haspopup` (the caret opens a dialog). */
    popup?: 'dialog' | 'menu'
    /** With `popup`: `aria-expanded`, and the on face while open. */
    expanded?: boolean
    /** Sets `aria-controls`: the id of the popover this button opens. */
    controls?: string
    /** Joined to a neighbour: `start` on its right, `end` on its left (corners are square anyway). */
    join?: 'start' | 'end'
    /** Shown, not pressable: no press, hold or long press. Stays focusable. */
    disabled?: boolean
    /** Repeat-while-held (Tempo ±): pointer down and up call `onhold`; a pointer click doesn't press; no long press. */
    hold?: boolean
    /** The accessible name. Default: the label, then the symbol's word ("Fill up"). */
    name?: string
    /** The tooltip key from `app/src/help/tooltips.ts` (e.g. `transport.panic`), rendered as `data-tip`. */
    tip?: string
    /** The app's `use:tip` action, passed in by the wiring; applied with `tip` when both are set. */
    tipAction?: Action<HTMLElement, string>
    /** Called on a click, Space or Enter; not for the click that ends a long press; with `hold`, only from the keyboard. */
    onpress?: () => void
    /** With `hold`: `true` when a primary pointer goes down, `false` once when that hold ends. */
    onhold?: (down: boolean) => void
    /** Called when the button is held for the long-press time, or right-clicked. */
    onlongpress?: () => void
    /** Called when the press that fired `onlongpress` ends. */
    onlongrelease?: () => void
  }

  let {
    label = '',
    symbol,
    size = 'md',
    bar,
    on = false,
    chosen = false,
    waiting = false,
    hue = 't',
    pressed,
    popup,
    expanded = false,
    controls,
    join,
    disabled = false,
    hold = false,
    name,
    tip,
    tipAction,
    onpress,
    onhold,
    onlongpress,
    onlongrelease,
  }: Props = $props()

  const GLYPHS: Record<Glyph, string> = {
    prev: '◀',
    next: '▶',
    up: '▲',
    down: '▼',
    plus: '+',
    minus: '−',
    caret: '▾',
  }
  const WORDS: Record<Glyph, string> = {
    prev: 'previous',
    next: 'next',
    up: 'up',
    down: 'down',
    plus: 'plus',
    minus: 'minus',
    caret: 'options',
  }

  /** Start / Stop running: the on face in `--ok`. */
  let running = $derived(size === 'band' && bar === true)
  let open = $derived(popup !== undefined && expanded)
  /** The face as drawn: chosen, then on (switched on, running or open), then waiting, then off. */
  let face = $derived(chosen ? 'chosen' : on || running || open ? 'on' : waiting ? 'waiting' : 'off')
  /** The hue drawn: running is green unless chosen; the deprecated grey `t2` and `m` are the neutral `t`. */
  let drawn = $derived<Hue>(running && !chosen ? 'ok' : hue === 't2' || hue === 'm' ? 't' : hue)
  let hueColour = $derived(drawn === 't' ? 'var(--neutral)' : drawn === 'lamp' ? 'var(--lamp-line)' : `var(--${drawn})`)
  /** The disabled outline and label: the drawn hue at reduced strength. */
  let absentColour = $derived(`var(--absent-${drawn === 't' ? 'neutral' : drawn})`)
  let accessibleName = $derived(name ?? [label, symbol ? WORDS[symbol] : ''].filter(Boolean).join(' '))

  let node: HTMLButtonElement | undefined = $state()
  /** The pointer of the hold in progress; not reactive, the effects below only read it. */
  let holdId: number | null = null

  function endHold(release: boolean) {
    const id = holdId
    if (id === null) return
    holdId = null
    if (release) {
      try {
        node?.releasePointerCapture?.(id)
      } catch {
        // No capture to release (jsdom, a pointer already gone).
      }
    }
    onhold?.(false)
  }

  // A hold ends at once when it can't continue: disabled, or no longer a hold button.
  $effect(() => {
    if (disabled || !hold) endHold(true)
  })
  // ...or when the button goes away while held.
  $effect(() => () => endHold(false))

  function pointerDown(event: PointerEvent) {
    if (!hold || disabled || event.button !== 0 || holdId !== null) return
    holdId = event.pointerId
    try {
      node?.setPointerCapture?.(event.pointerId)
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
    onhold?.(true)
  }

  function pointerEnd(event: PointerEvent) {
    if (holdId !== null && event.pointerId === holdId) endHold(false)
  }

  function click(event: MouseEvent) {
    if (disabled) return
    if (hold && event.detail !== 0) return
    onpress?.()
  }

  /** Applies the parent's tooltip action when both it and a key are given. */
  const tipped: Action<HTMLElement, string | undefined> = (target, key) => {
    if (!tipAction || key === undefined) return
    const handle = tipAction(target, key)
    return {
      update: (next) => {
        if (next !== undefined) handle?.update?.(next)
      },
      destroy: () => handle?.destroy?.(),
    }
  }
</script>

<button
  bind:this={node}
  type="button"
  class="btn {size} face-{face}"
  class:alone={label === ''}
  class:join-start={join === 'start'}
  class:join-end={join === 'end'}
  class:disabled
  style:--hue={hueColour}
  style:--hue-absent={absentColour}
  data-face={disabled ? 'disabled' : face}
  data-hue={drawn}
  data-bar={running ? '' : undefined}
  data-contrast={disabled ? 'dim' : undefined}
  data-tip={tip}
  aria-label={accessibleName}
  aria-pressed={pressed}
  aria-haspopup={popup}
  aria-expanded={popup !== undefined ? expanded : undefined}
  aria-controls={controls}
  aria-disabled={disabled ? 'true' : undefined}
  onclick={click}
  onpointerdown={pointerDown}
  onpointerup={pointerEnd}
  onpointercancel={pointerEnd}
  onlostpointercapture={pointerEnd}
  use:tipped={tip}
  use:longpress={{ onlongpress, onlongrelease, disabled: disabled || hold || onlongpress === undefined }}
>
  {label}{#if symbol}{label ? ' ' : ''}<span class="sym sym-{symbol}" aria-hidden="true">{GLYPHS[symbol]}</span
    >{/if}
</button>

<style>
  /* Rest: no fill, a 1px inset outline and the label in the hue (inset, so the box never changes
     size). The hue comes in as --hue. */
  .btn {
    position: relative;
    isolation: isolate;
    box-sizing: border-box;
    height: var(--control-height);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--hue);
    color: var(--hue);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
    text-align: center;
    white-space: nowrap;
    cursor: pointer;
  }

  /* Sizes. Every size but `cell` keeps its width in a crowded flex row. */
  .btn:not(.cell) {
    flex: none;
  }
  .icon {
    width: var(--control-height);
  }
  .md {
    padding: 0 var(--space-14);
  }
  .band {
    width: var(--button-band-width);
    padding: 0 var(--space-8);
    text-align: left;
  }
  .pair {
    width: var(--button-pair-width);
  }
  .cell {
    width: 100%;
    min-width: 0;
  }
  .caret {
    width: var(--caret-width);
  }

  /* Glyphs: inline on the label's baseline, no line-height of their own. */
  /* Glyphs: ▲ ▼ ▾ small, ◀ ▶ a step larger; + − are the label's own type. */
  .sym-up,
  .sym-down,
  .sym-caret {
    font-size: var(--glyph-sm);
  }
  .sym-prev,
  .sym-next {
    font-size: var(--glyph-md);
  }

  /* On and chosen: a solid fill in the hue, the label in --on-ink. */
  .face-on,
  .face-chosen {
    background: var(--hue);
    color: var(--on-ink);
  }
  /* Waiting: a 2px inset ring in the hue over a faint fill of it, drawn under the label. */
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
  /* Disabled: a 1px outline and the label in the hue at reduced strength (--hue-absent), no fill,
     whatever the face. */
  .btn.disabled {
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--hue-absent);
    color: var(--hue-absent);
    cursor: default;
  }
  .btn.disabled::before {
    content: none;
  }

  .join-start {
    border-radius: var(--radius) 0 0 var(--radius);
  }
  .join-end {
    border-radius: 0 var(--radius) var(--radius) 0;
  }

  .btn:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
</style>
