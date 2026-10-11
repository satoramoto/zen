<!--
  QuickRacksBar: the Library's Quick Racks bar, filling its container's width. A group header
  "Quick Racks" holding ◀ the bank letter ▶, the Store lamp (on = armed) and Clear (the waiting
  face in the Ending hue while armed); under it the bank's eight slots in two rows of four. Slot
  faces: loaded (the live rack) a solid neutral fill with --on-ink, stored a 1px neutral outline
  with the name in --t, empty a faded outline and "Empty", missing the name in --warn after ⚠.
  Store armed rings every slot not loaded (a store target, empty ones included); Clear armed rings
  the stored and loaded slots in the Ending hue. Long press or right-click on a slot asks for
  onslotlong. Fully controlled: every face comes from props; it holds no state.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import { longpress } from '../actions/longpress'
  import Button from '../Button/Button.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import type { QuickSlot } from './types'

  type Props = {
    /** The bank's letter ("A"). */
    bank: string
    /** How many banks there are, for the letter's accessible name ("Bank A of 8") and the ends of ◀ ▶. */
    bankCount?: number
    /** The bank's eight slots, in order. */
    slots: QuickSlot[]
    /** Store is armed: the lamp is on and every slot not loaded wears the waiting face. */
    store?: boolean
    /** Clear is armed: Clear and the stored and loaded slots wear the waiting face in the Ending hue. */
    clear?: boolean
    /** Read-only: every control is shown but disabled. */
    readOnly?: boolean
    /** A fixed width in px (the left column's 320). Default: fills its container. */
    width?: number
    /** The app's `use:tip` action, passed in by the wiring; applied with each control's tooltip key. */
    tipAction?: Action<HTMLElement, string>
    /** Called with -1 for ◀ and 1 for ▶. */
    onbank?: (delta: -1 | 1) => void
    /** Called when Store is pressed (arm or disarm). */
    onstore?: () => void
    /** Called when Clear is pressed (arm or disarm). */
    onclear?: () => void
    /** Called with the slot's index (0..7) on a click, Space or Enter. */
    onslot?: (index: number) => void
    /** Called with the slot's index (0..7) on a long press or a right-click. */
    onslotlong?: (index: number) => void
  }

  let {
    bank,
    bankCount = 8,
    slots,
    store = false,
    clear = false,
    readOnly = false,
    width,
    tipAction,
    onbank,
    onstore,
    onclear,
    onslot,
    onslotlong,
  }: Props = $props()

  const WARN = '⚠'
  let bankIndex = $derived(bank.toUpperCase().charCodeAt(0) - 65)
  let atFirst = $derived(bankIndex <= 0)
  let atLast = $derived(bankIndex >= bankCount - 1)

  /** The face a slot wears: waiting when an armed Store or Clear targets it, else its state's. */
  function face(slot: QuickSlot): 'chosen' | 'waiting' | 'off' {
    if (clear && (slot.state === 'stored' || slot.state === 'loaded')) return 'waiting'
    if (slot.state === 'loaded') return 'chosen'
    if (store) return 'waiting'
    return 'off'
  }

  function spoken(slot: QuickSlot): string {
    const what =
      slot.state === 'empty' ? 'empty' : slot.state === 'missing' ? 'rack missing' : slot.name
    return `Quick Rack ${bank}${slot.label}, ${what}${slot.state === 'loaded' ? ', loaded' : ''}`
  }

  function shown(slot: QuickSlot): string {
    if (slot.state === 'empty') return 'Empty'
    if (slot.state === 'missing') return slot.name.trim() === '' ? 'Missing' : slot.name
    return slot.name
  }

  function press(index: number) {
    if (readOnly) return
    onslot?.(index)
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

<section class="bar" aria-label="Quick Racks" style:width={width === undefined ? '100%' : `${width}px`}>
  <GroupHeader title="Quick Racks" level={3}>
    <span class="bank">
      <Button
        symbol="prev"
        size="icon"
        name="Previous bank"
        tip="quick.bank_prev"
        disabled={readOnly || atFirst}
        {tipAction}
        onpress={() => onbank?.(-1)}
      />
      <span class="letter"
        ><span aria-hidden="true">{bank}</span><span class="hidden">Bank {bank} of {bankCount}</span></span
      >
      <Button
        symbol="next"
        size="icon"
        name="Next bank"
        tip="quick.bank_next"
        disabled={readOnly || atLast}
        {tipAction}
        onpress={() => onbank?.(1)}
      />
    </span>
    <span class="arm">
      <LampButton
        label="Store"
        on={store}
        tip="quick.store"
        disabled={readOnly}
        {tipAction}
        ontoggle={() => onstore?.()}
      />
      <Button
        label="Clear"
        waiting={clear}
        hue={clear ? 'ending' : 't'}
        pressed={clear}
        name="Clear: arm, then tap a slot to empty it"
        tip="quick.clear"
        disabled={readOnly}
        {tipAction}
        onpress={() => onclear?.()}
      />
    </span>
  </GroupHeader>
  <div class="slots">
    {#each slots as slot, i (i)}
      {@const drawn = face(slot)}
      <button
        type="button"
        class="slot face-{drawn} state-{slot.state}"
        class:clearing={clear && drawn === 'waiting'}
        class:disabled={readOnly}
        data-face={readOnly ? 'disabled' : drawn}
        data-state={slot.state}
        data-tip={slot.tip}
        aria-label={spoken(slot)}
        aria-disabled={readOnly ? 'true' : undefined}
        onclick={() => press(i)}
        use:tipped={slot.tip}
        use:longpress={{ onlongpress: () => onslotlong?.(i), disabled: readOnly }}
      >
        <span class="index">{slot.label}</span>
        <span class="name"
          >{#if slot.state === 'missing'}<span class="warn" aria-hidden="true">{WARN}</span>{/if}{shown(slot)}</span
        >
      </button>
    {/each}
  </div>
</section>

<style>
  .bar {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    font-family: var(--font-sans);
  }
  /* The header's control groups stand on its rule (the 32px controls don't share its baseline). */
  .bank,
  .arm {
    display: flex;
    flex: none;
    align-items: center;
    align-self: flex-end;
    gap: var(--space-4);
  }
  .arm {
    margin-left: auto;
  }
  .letter {
    min-width: var(--space-12);
    color: var(--t);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    text-align: center;
  }
  .hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .slots {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-rows: var(--control-height);
    gap: var(--space-4);
  }
  /* A slot: the index then the name, left-aligned. Rest (stored, missing): a 1px neutral outline. */
  .slot {
    --hue: var(--neutral);
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    gap: var(--space-6);
    box-sizing: border-box;
    min-width: 0;
    margin: 0;
    padding: 0 var(--space-6);
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--hue);
    color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    cursor: pointer;
  }
  .index {
    flex: none;
    color: var(--caption-ink);
    font-variant-numeric: tabular-nums;
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* Empty: the outline faded (never grey), "Empty" in the caption ink. */
  .state-empty {
    box-shadow: inset 0 0 0 var(--outline-width) var(--absent);
  }
  .state-empty .name {
    color: var(--caption-ink);
  }
  /* Missing: the name and ⚠ in the warning hue. */
  .state-missing .name {
    color: var(--warn);
  }
  .warn {
    margin-right: var(--space-4);
  }
  /* Loaded (the live rack): a solid neutral fill, everything in --on-ink. */
  .state-loaded {
    background: var(--neutral);
    color: var(--on-ink);
  }
  .state-loaded .index {
    color: var(--on-ink);
  }
  /* Waiting (a store or clear target): a 2px ring over a faint fill of the hue, under the text. */
  .face-waiting {
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--hue);
  }
  .face-waiting.clearing {
    --hue: var(--ending);
  }
  .face-waiting:not(.state-loaded)::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--hue);
    opacity: var(--wait-fill-opacity);
  }
  .slot.disabled {
    cursor: default;
  }
  .slot:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
</style>
