<!--
  Keys: the 56px OLED key strip. Dark keys over a key range; with a split, the left zone's keys are
  tinted, a teal line with its glow runs along its top and a 2px white line marks the split. The
  split can be any key, black ones too: beside the black keys the line steps round them the way
  the keys' own edges do. Held keys fill with their part's hue and glow. Every C carries its name
  in mono. The picture has an accessible label that says the split and the held notes.

  With `onsplit`, the split is set right here: the split line carries a handle (a slider) to drag
  along the keys or step with the arrows; a click on it arms a pick (`onpick`), and while armed
  (`picking`, a 2px teal ring round the keys) the next key pressed with the pointer becomes the
  split. Esc disarms. Unarmed, clicking a key does nothing, so playing never moves the split. A
  locked split (`splitLocked`) shows the handle faded and moves for nothing. Controlled: the strip
  never moves the split itself, it asks through `onsplit`.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import { keysLabel, layout, noteAt, noteName, type KeyPart, type KeyRange } from './keys'

  type Props = {
    /** The lowest and highest MIDI note shown, both included (C3 = 60). Default: C1–C6, 61 keys. */
    range?: KeyRange
    /** The split note, the highest note of the left zone; null = no split (no left zone). */
    split?: number | null
    /** The held notes the left part plays: they fill in the L hue. */
    heldLeft?: number[]
    /** The held notes the right hand plays: they fill in `rightPart`'s hue. */
    heldRight?: number[]
    /** The right-hand part whose hue the right's held keys take. */
    rightPart?: Exclude<KeyPart, 'l'>
    /** The strip's width in px, its 1px border included. */
    width?: number
    /** The lowest and highest note the split may be set to (the engine's 24–96). */
    splitMin?: number
    splitMax?: number
    /** Parameter lock on the split: the handle is shown faded and nothing here moves it. */
    splitLocked?: boolean
    /** Armed: the next key pressed with the pointer becomes the split (a 2px ring round the keys). */
    picking?: boolean
    /** The app's `use:tip` action, applied to the split handle. */
    tipAction?: Action<HTMLElement, string>
    /** Asks for a new split note (a drag, an arrow, or a key picked while armed). Without it the strip is a picture. */
    onsplit?: (note: number) => void
    /** Asks to arm (`true`) or disarm (`false`) the pick: a click on the handle, Enter, Esc, or a key picked. */
    onpick?: (armed: boolean) => void
  }

  let {
    range = { low: 36, high: 96 },
    split = 54,
    heldLeft = [],
    heldRight = [],
    rightPart = 'r1',
    width = 1392,
    splitMin = 24,
    splitMax = 96,
    splitLocked = false,
    picking = false,
    tipAction,
    onsplit,
    onpick,
  }: Props = $props()

  /** A drag moves the split only once the pointer has moved this far, so a click stays a click. */
  const DRAG_SLOP = 3

  // The strip's 1px border on each side.
  let keys = $derived(layout(range, Math.max(0, width - 2), split, heldLeft, heldRight, rightPart))
  let label = $derived(keysLabel(range, split, heldLeft, heldRight))
  let interactive = $derived(onsplit !== undefined && split !== null)
  let armed = $derived(interactive && picking && !splitLocked)

  let strip: HTMLDivElement | undefined = $state()

  /** Applies the parent's tooltip action when it is given. */
  const tipped: Action<HTMLElement, string> = (node, key) => {
    if (!tipAction) return
    const handle = tipAction(node, key)
    return { update: (next) => handle?.update?.(next), destroy: () => handle?.destroy?.() }
  }

  /** Asks for a split note, clamped to the range; nothing when it is already there or locked. */
  function ask(note: number | null) {
    if (note === null || splitLocked || split === null) return
    const next = Math.max(splitMin, Math.min(splitMax, Math.round(note)))
    if (next !== split) onsplit?.(next)
  }

  /** The key under a pointer; `top` reads it at the black keys' height (a drag: black keys by x alone). */
  function keyUnder(event: PointerEvent, top: boolean): number | null {
    const box = strip?.getBoundingClientRect()
    if (!box) return null
    // The strip may be drawn scaled (the screens scale to fit): map back to its own px.
    const scale = box.width > 0 ? width / box.width : 1
    const x = (event.clientX - box.left) * scale - 1
    const y = top ? 0 : (event.clientY - box.top) * scale - 1
    return noteAt(keys, x, y)
  }

  function capture(event: PointerEvent) {
    try {
      ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
  }

  // ── The handle: drag to move; a click (no drag) arms or disarms the pick.
  let handlePointer: number | null = null
  let startX = 0
  let dragged = false

  function handleDown(event: PointerEvent) {
    if (event.button !== 0 || splitLocked) return
    handlePointer = event.pointerId
    startX = event.clientX
    dragged = false
    capture(event)
  }
  function handleMove(event: PointerEvent) {
    if (handlePointer !== event.pointerId) return
    if (!dragged && Math.abs(event.clientX - startX) < DRAG_SLOP) return
    dragged = true
    ask(keyUnder(event, true))
  }
  function handleUp(event: PointerEvent) {
    if (handlePointer !== event.pointerId) return
    handlePointer = null
    if (!dragged) onpick?.(!picking)
  }
  function handleCancel(event: PointerEvent) {
    if (handlePointer === event.pointerId) handlePointer = null
  }

  function handleKey(event: KeyboardEvent) {
    if (split === null) return
    if (event.key === 'Escape') {
      if (picking) {
        event.preventDefault()
        onpick?.(false)
      }
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!splitLocked) onpick?.(!picking)
      return
    }
    const to: Record<string, number> = {
      ArrowRight: split + 1,
      ArrowUp: split + 1,
      ArrowLeft: split - 1,
      ArrowDown: split - 1,
      PageUp: split + 12,
      PageDown: split - 12,
      Home: splitMin,
      End: splitMax,
    }
    if (!(event.key in to)) return
    event.preventDefault()
    ask(to[event.key])
  }

  // ── The pick, while armed: the key pressed becomes the split; sliding keeps choosing; lifting disarms.
  let pickPointer: number | null = null

  function pickDown(event: PointerEvent) {
    if (event.button !== 0) return
    pickPointer = event.pointerId
    capture(event)
    ask(keyUnder(event, false))
  }
  function pickMove(event: PointerEvent) {
    if (pickPointer === event.pointerId) ask(keyUnder(event, false))
  }
  function pickUp(event: PointerEvent) {
    if (pickPointer !== event.pointerId) return
    pickPointer = null
    onpick?.(false)
  }
  function pickCancel(event: PointerEvent) {
    if (pickPointer === event.pointerId) pickPointer = null
  }

  /** Esc while armed disarms, and only that: caught first (capture) so the app's Esc doesn't also leave the screen. */
  function windowKey(event: KeyboardEvent) {
    if (!armed || event.key !== 'Escape') return
    event.preventDefault()
    event.stopImmediatePropagation()
    onpick?.(false)
  }
</script>

<svelte:window onkeydowncapture={windowKey} />

<div class="keys" style:width="{width}px" data-picking={armed ? '' : undefined}>
  <div class="strip" role="img" aria-label={label} bind:this={strip}>
    {#each keys.whites as key (key.note)}
      <div
        class="white"
        class:left={key.left}
        data-held={key.held ?? undefined}
        style:left="{key.x}px"
        style:width="{keys.whiteWidth}px"
      >
        {key.label}
      </div>
    {/each}
    {#each keys.blacks as key (key.note)}
      <div class="black" class:left={key.left} data-held={key.held ?? undefined} style:left="{key.x}px"></div>
    {/each}
    {#if keys.splitX !== null}
      <div class="zone" style:--split-x="{keys.splitX}px" style:--split-step={keys.splitStep}></div>
      <div class="split" data-step={keys.splitStep} style:--split-x="{keys.splitX}px" style:--split-step={keys.splitStep}>
        <span class="top"></span>
        {#if keys.splitStep !== 0}<span class="join"></span>{/if}
        <span class="bottom"></span>
      </div>
    {/if}
  </div>
  {#if armed}
    <!-- The pick surface: pointer only (the handle's arrows are the keyboard's way). -->
    <div
      class="pick"
      aria-hidden="true"
      onpointerdown={pickDown}
      onpointermove={pickMove}
      onpointerup={pickUp}
      onpointercancel={pickCancel}
    ></div>
  {/if}
  {#if interactive && keys.splitX !== null && split !== null}
    <span
      class="handle"
      class:locked={splitLocked}
      class:armed
      role="slider"
      tabindex="0"
      style:left="{keys.splitX + 1}px"
      aria-label={splitLocked
        ? 'Split point (locked)'
        : armed
          ? 'Split point: click a key to set it, Esc cancels'
          : 'Split point: drag, or click then click a key'}
      aria-orientation="horizontal"
      aria-valuemin={splitMin}
      aria-valuemax={splitMax}
      aria-valuenow={split}
      aria-valuetext={noteName(split)}
      aria-disabled={splitLocked ? 'true' : undefined}
      data-tip="settings.split_strip"
      use:tipped={'settings.split_strip'}
      onkeydown={handleKey}
      onpointerdown={handleDown}
      onpointermove={handleMove}
      onpointerup={handleUp}
      onpointercancel={handleCancel}
    >
      <span class="grip"></span>
    </span>
  {/if}
</div>

<style>
  .keys {
    /* The split handle's hit area and grip. */
    --keys-handle-width: 16px;
    --keys-grip-width: 6px;
    --keys-grip-height: 12px;
    position: relative;
    flex: none;
    box-sizing: border-box;
    height: var(--keys-height);
  }
  .strip {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--g);
  }
  .white {
    position: absolute;
    top: 0;
    box-sizing: border-box;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: var(--keys-label-bottom);
    border-right: var(--line-width) solid var(--keyline);
    background: var(--key-white);
    color: var(--key-label);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-family: var(--font-mono);
    line-height: var(--keys-label-line);
  }
  .white.left {
    background: var(--key-white-left);
  }
  .black {
    position: absolute;
    top: 0;
    width: var(--keys-black-width);
    height: var(--keys-black-height);
    margin-left: calc(var(--keys-black-width) / -2);
    border-radius: 0 0 var(--keys-black-radius) var(--keys-black-radius);
    background: var(--key-black);
    box-shadow: inset 0 0 0 var(--line-width) var(--key-black-ring);
  }
  .black.left {
    box-shadow: inset 0 0 0 var(--line-width) var(--key-black-ring-left);
  }
  /* `.strip` first so a held key beats the left zone's tint. */
  .strip [data-held] {
    color: var(--solid-ink);
  }
  .strip [data-held='r1'] {
    background: var(--r1);
    box-shadow: var(--key-glow-r1);
  }
  .strip [data-held='r2'] {
    background: var(--r2);
    box-shadow: var(--key-glow-r2);
  }
  .strip [data-held='r3'] {
    background: var(--r3);
    box-shadow: var(--key-glow-r3);
  }
  .strip [data-held='l'] {
    background: var(--l);
    box-shadow: var(--key-glow-l);
  }
  /* The left zone's top line runs to where the split line meets the top. */
  .zone {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(var(--split-x) + var(--split-step) * var(--keys-black-width) / 2);
    height: var(--keys-zone-line);
    background: var(--l);
    box-shadow: var(--bl);
  }
  /* The split line: beside the black keys (top) it runs along the split key's edge, below them
     along the white keys' edge, joined across when the two differ. */
  .split {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .split > span {
    position: absolute;
    background: var(--t);
  }
  .top {
    top: 0;
    left: calc(var(--split-x) + var(--split-step) * var(--keys-black-width) / 2);
    width: var(--keys-split-width);
    height: var(--keys-black-height);
  }
  .bottom {
    top: var(--keys-black-height);
    bottom: 0;
    left: var(--split-x);
    width: var(--keys-split-width);
  }
  .join {
    top: calc(var(--keys-black-height) - var(--keys-split-width));
    left: var(--split-x);
    width: calc(var(--keys-black-width) / 2 + var(--keys-split-width));
    height: var(--keys-split-width);
  }
  .split[data-step='-1'] .join {
    left: calc(var(--split-x) - var(--keys-black-width) / 2);
  }
  /* Armed: a 2px ring in the left zone's hue round the keys, and a crosshair over them. */
  .pick {
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--l);
    cursor: crosshair;
    touch-action: none;
  }
  .handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--keys-handle-width);
    margin-left: calc(var(--keys-handle-width) / -2);
    cursor: ew-resize;
    touch-action: none;
  }
  .handle:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
  .grip {
    position: absolute;
    top: calc(var(--keys-black-height) + (var(--keys-height) - var(--keys-black-height)) / 2);
    left: 50%;
    width: var(--keys-grip-width);
    height: var(--keys-grip-height);
    background: var(--t);
    transform: translate(-50%, -50%);
  }
  .handle.armed .grip {
    background: var(--l);
  }
  .handle.locked {
    cursor: not-allowed;
  }
  .handle.locked .grip {
    background: var(--absent-neutral);
  }
</style>
