<!--
  QuickRacks: the Quick Racks display page, in the Stage's display box (--page-width ×
  --page-height, 1392 × 288). No now-playing block: the app bar names the rack and the style.

  ┌ Quick Racks   Bank [A] B C D E F G H   Lit A1   Rack ◀ ▶  (Undo store on A3)  Library › Racks  [Store] ┐
  │ [A1 Sunday drive ● Loaded ✕] [A2 Warm keys Stored ✕] … [A8 Empty]   (eight slots, one row) │
  ├ One Touch                                  [Link]   Timing  Immediate [At Main change]     ┤
  │ [Piano solo · OTS 1][Style's own ▾]  [Strings up · OTS 2][Style's own ▾]  …  (four)        │
  └ ■ Loaded □ Stored ◌ Empty ▢ Armed       the gesture help, or the waiting Store's Save, here ┘

  Slots, in the state language: loaded (the live rack) a solid --neutral block in --on-ink, the
  modified dot after its name; stored a 1px --neutral outline; empty a faded (--absent) outline and
  "Empty" in the caption ink; missing the name in --warn after ⚠. Store armed puts every slot not
  loaded on the waiting face (a 2px ring over a faint fill), the store targets; the slot waiting for
  the live rack's save keeps it and says "Waiting for Save". The clear ✕ (Ending hue) sits on every
  slot that holds a rack. A tap asks for onslot (load; the lit one recalls it clean); a long press or
  right-click asks for onslotlong (save the live rack over that slot). After a store, "Undo store on
  A3" sits before Library › Racks in the header (only while `undo` is set) and asks for onundo.

  One Touch: the style's OTS 1–4, the applied one on the chosen face (a solid --neutral block); a
  click applies it at once. Beside each, what it loads for this style: "Style's own" or one of your
  racks (a missing one in --warn). Link is a lamp; its timing is a one-of-two tab run.

  Fully controlled: every face comes from props; only the callbacks change anything.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import { longpress } from '../actions/longpress'
  import Button from '../Button/Button.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import type { TabItem } from '../ChosenTabs/types'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import type { LinkTiming, OneTouchRow, QuickRackSlot, StoreUndo, StoreWait } from './types'

  type Props = {
    /** The bank on view, 0–7 (A–H). */
    bank: number
    /** How many banks there are (their letters from A). */
    bankCount?: number
    /** The bank's eight slots, in order. */
    slots: QuickRackSlot[]
    /** The lit slot's code ("A1", or "C4" in another bank); empty when no Quick Rack is loaded. */
    lit?: string
    /** Store is armed: the lamp is on and every slot not loaded is a store target. */
    store?: boolean
    /** Quick Racks can't be changed: every Quick Rack control is shown disabled and the foot says why. */
    readOnly?: boolean
    /** A Store waiting for the live rack's save; null when none. */
    waiting?: StoreWait | null
    /** The last store over a Quick Rack, which Undo takes back; null: no Undo shown. */
    undo?: StoreUndo | null
    /** The One Touch row. */
    oneTouch: OneTouchRow
    /** The app's `use:tip` action, passed in by the wiring; applied with each control's tooltip key. */
    tipAction?: Action<HTMLElement, string>
    /** Called with the bank chosen, 0–7. */
    onbank?: (bank: number) => void
    /** Called with -1 for the previous rack in the bank, 1 for the next. */
    onstep?: (delta: -1 | 1) => void
    /** Called when Store is pressed (arm or disarm). */
    onstore?: () => void
    /** Called with a slot's index (0–7) on a click, Space or Enter. */
    onslot?: (index: number) => void
    /** Called with a slot's index (0–7) on a long press or a right-click: save the live rack over it. */
    onslotlong?: (index: number) => void
    /** Called with a slot's index (0–7) when its ✕ is pressed. */
    onclear?: (index: number) => void
    /** Called when Library › Racks is pressed. */
    onlibrary?: () => void
    /** Called with an OTS's index (0–3) when it's pressed: apply it. */
    onots?: (index: number) => void
    /** Called with an OTS's index (0–3) and the rack picked for it; '' = the style's own. */
    onotsrack?: (index: number, rack: string) => void
    /** Called when Link is pressed. */
    onlink?: () => void
    /** Called with the Link timing chosen. */
    ontiming?: (timing: LinkTiming) => void
    /** Called with the name field's text as it's typed (a waiting Store of a never-saved rack). */
    onname?: (name: string) => void
    /** Called when the waiting Store's Save rack is pressed. */
    onsave?: () => void
    /** Called when the waiting Store's Cancel is pressed. */
    oncancel?: () => void
    /** Called when Undo is pressed: take the last store back. */
    onundo?: () => void
  }

  let {
    bank,
    bankCount = 8,
    slots,
    lit = '',
    store = false,
    readOnly = false,
    waiting = null,
    undo = null,
    oneTouch,
    tipAction,
    onbank,
    onstep,
    onstore,
    onslot,
    onslotlong,
    onclear,
    onlibrary,
    onots,
    onotsrack,
    onlink,
    ontiming,
    onname,
    onsave,
    oncancel,
    onundo,
  }: Props = $props()

  /** What Undo puts back, spoken after its label. */
  function undoSpoken(u: StoreUndo): string {
    const back = u.name.trim() === '' ? `empty ${u.code} again` : `put ${u.name} back`
    return `Undo store on ${u.code}: ${back}`
  }

  const OTS_COUNT = 4
  const WARN = '⚠'
  const DOT = '●'
  const CLEAR = '✕'

  const letter = (i: number) => String.fromCharCode(65 + i)
  let bankTabs: TabItem[] = $derived(
    Array.from({ length: bankCount }, (_, i) => ({
      id: String(i),
      label: letter(i),
      name: `Bank ${letter(i)}`,
      tip: 'quick.bank',
      disabled: readOnly,
    })),
  )
  const TIMING_TABS: TabItem[] = [
    { id: 'immediate', label: 'Immediate', tip: 'ots.link_timing' },
    { id: 'mainChange', label: 'At Main change', name: 'At Main section change', tip: 'ots.link_timing' },
  ]

  /** The face a slot wears: chosen when loaded; waiting as a store target; else rest. */
  function face(slot: QuickRackSlot): 'chosen' | 'waiting' | 'rest' {
    if (slot.state === 'loaded') return 'chosen'
    if (slot.waiting || (store && !readOnly)) return 'waiting'
    return 'rest'
  }

  /** The word under a slot's name. */
  function word(slot: QuickRackSlot): string {
    if (slot.waiting) return 'Waiting for Save'
    if (slot.state === 'loaded') return slot.modified ? 'Loaded · modified' : 'Loaded'
    if (slot.state === 'stored') return 'Stored'
    if (slot.state === 'missing') return 'Rack missing'
    return store && !readOnly ? 'Store here' : ''
  }

  function shown(slot: QuickRackSlot): string {
    if (slot.state === 'empty') return 'Empty'
    if (slot.state === 'missing') return slot.name.trim() === '' ? 'Missing' : slot.name
    return slot.name
  }

  function spoken(slot: QuickRackSlot): string {
    const what = slot.state === 'empty' ? 'empty' : slot.state === 'missing' ? 'rack missing' : slot.name
    const tail = slot.waiting
      ? ', waiting for Save'
      : slot.state === 'loaded'
        ? `, loaded${slot.modified ? ', modified' : ''}`
        : ''
    return `Quick Rack ${slot.code}, ${what}${tail}`
  }

  function otsName(i: number): string {
    const item = oneTouch.items[i]
    return item && item.name.trim() !== '' ? item.name : `OTS ${i + 1}`
  }

  function otsCode(i: number): string {
    const item = oneTouch.items[i]
    if (!item || item.rack === '') return `OTS ${i + 1}`
    return item.missing ? `OTS ${i + 1} · rack missing` : `OTS ${i + 1} · your rack`
  }

  /** Puts the select back to its controlled value, then reports what was picked. */
  function picked(select: HTMLSelectElement, i: number) {
    const chosen = select.value
    select.value = oneTouch.items[i]?.rack ?? ''
    onotsrack?.(i, chosen)
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

<section class="page" aria-label="Quick Racks">
  <GroupHeader title="Quick Racks" level={2}>
    <span class="group">
      <span class="cap">Bank</span>
      <ChosenTabs
        tabs={bankTabs}
        chosen={String(bank)}
        label="Quick Racks bank"
        {tipAction}
        onchoose={(id) => {
          if (!readOnly) onbank?.(Number(id))
        }}
      />
    </span>
    <span class="group">
      <span class="cap">Lit</span>
      <span class="value">{lit === '' ? 'none' : lit}</span>
    </span>
    {#snippet end()}
      <span class="controls">
        <span class="cap">Rack</span>
        <Button
          symbol="prev"
          size="icon"
          name="Previous rack"
          tip="quick.prev"
          {tipAction}
          onpress={() => onstep?.(-1)}
        />
        <Button symbol="next" size="icon" name="Next rack" tip="quick.next" {tipAction} onpress={() => onstep?.(1)} />
        <span class="gap"></span>
        {#if undo && !readOnly}
          <Button
            label="Undo store on {undo.code}"
            name={undoSpoken(undo)}
            tip="quick.undo"
            {tipAction}
            onpress={() => onundo?.()}
          />
        {/if}
        <Button
          label="Library › Racks"
          name="Open Library on its Racks page"
          tip="quick.library"
          {tipAction}
          onpress={() => onlibrary?.()}
        />
        <LampButton label="Store" on={store} tip="quick.store" disabled={readOnly} {tipAction} ontoggle={() => onstore?.()} />
      </span>
    {/snippet}
  </GroupHeader>

  <div class="slots" role="group" aria-label="Quick Racks {letter(bank)}1 to {letter(bank)}8">
    {#each slots as slot, i (i)}
      {@const drawn = face(slot)}
      <div class="cell face-{drawn} state-{slot.state}" class:waits={slot.waiting} class:disabled={readOnly}>
        <button
          type="button"
          class="slot"
          data-face={readOnly ? 'disabled' : drawn}
          data-state={slot.state}
          data-tip={slot.tip}
          aria-label={spoken(slot)}
          aria-disabled={readOnly ? 'true' : undefined}
          onclick={() => {
            if (!readOnly) onslot?.(i)
          }}
          use:tipped={slot.tip}
          use:longpress={{ onlongpress: () => onslotlong?.(i), disabled: readOnly }}
        >
          <span class="code">{slot.code}</span>
          <span class="name"
            >{#if slot.state === 'missing'}<span class="warn" aria-hidden="true">{WARN}</span>{/if}<span class="text"
              >{shown(slot)}</span
            >{#if slot.state === 'loaded' && slot.modified}<span class="dot" aria-hidden="true">{DOT}</span>{/if}</span
          >
          <span class="word">{word(slot)}</span>
        </button>
        {#if slot.state !== 'empty' && !readOnly}
          <button
            type="button"
            class="clear"
            aria-label="Clear Quick Rack {slot.code}"
            data-tip="quick.clear"
            use:tipped={'quick.clear'}
            onclick={() => onclear?.(i)}>{CLEAR}</button
          >
        {/if}
      </div>
    {/each}
  </div>

  <GroupHeader title="One Touch" level={2}>
    <span class="group">
      <span class="cap">Link timing</span>
      <ChosenTabs
        tabs={TIMING_TABS}
        chosen={oneTouch.timing}
        label="OTS Link timing"
        {tipAction}
        onchoose={(id) => ontiming?.(id as LinkTiming)}
      />
    </span>
    {#snippet end()}
      <span class="controls">
        <span class="cap">Main A–D recall OTS 1–4</span>
        <LampButton label="Link" on={oneTouch.link} tip="ots.link" {tipAction} ontoggle={() => onlink?.()} />
      </span>
    {/snippet}
  </GroupHeader>

  <div class="ots" role="group" aria-label="One Touch 1 to 4">
    {#each Array.from({ length: OTS_COUNT }, (_, i) => i) as i (i)}
      {@const item = oneTouch.items[i]}
      {@const applied = oneTouch.applied === i + 1}
      <span class="ots-cell">
        <button
          type="button"
          class="ots-button"
          class:chosen={applied}
          class:absent={!item}
          data-face={!item ? 'disabled' : applied ? 'chosen' : 'rest'}
          data-tip="ots.{i + 1}"
          aria-pressed={applied}
          aria-disabled={item ? undefined : 'true'}
          aria-label="{otsName(i)}, One Touch {i + 1}{applied ? ', applied' : ''}"
          use:tipped={`ots.${i + 1}`}
          onclick={() => {
            if (item) onots?.(i)
          }}
        >
          <span class="ots-name">{otsName(i)}</span>
          <span class="ots-code" class:missing={item?.missing}>{otsCode(i)}</span>
        </button>
        <span class="picker" class:missing={item?.missing}>
          <select
            class="field"
            value={item?.rack ?? ''}
            disabled={!item || oneTouch.readOnly}
            aria-label="OTS {i + 1} loads"
            data-tip="ots.rack"
            use:tipped={'ots.rack'}
            onchange={(e) => picked(e.currentTarget, i)}
          >
            <option value="">Style's own</option>
            {#if item?.missing}<option value={item.rack}>{WARN} {item.rackName || 'Missing rack'}</option>{/if}
            {#each oneTouch.racks as r (r.id)}<option value={r.id}>{r.name}</option>{/each}
          </select>
          <span class="caret" aria-hidden="true">▾</span>
        </span>
      </span>
    {/each}
  </div>

  <div class="foot">
    <span class="legend" aria-hidden="true">
      <span class="key"><span class="swatch loaded"></span>Loaded</span>
      <span class="key"><span class="swatch stored"></span>Stored</span>
      <span class="key"><span class="swatch empty"></span>Empty</span>
      <span class="key"><span class="swatch armed"></span>Store target</span>
    </span>
    {#if waiting}
      <span class="ask" role="group" aria-label="Save the rack to store it on {waiting.code}">
        <span class="say"
          ><b>{waiting.code}</b> waiting for Save · {waiting.needsName
            ? 'name the new rack'
            : `${waiting.rack} modified`}</span
        >
        {#if waiting.needsName}
          <input
            class="field name"
            type="text"
            aria-label="Rack name"
            value={waiting.name}
            data-tip="quick.save_name"
            use:tipped={'quick.save_name'}
            oninput={(e) => onname?.(e.currentTarget.value)}
            onkeydown={(e) => {
              if (e.key === 'Enter') onsave?.()
            }}
          />
        {/if}
        <Button label="Save rack" size="md" tip="quick.save" {tipAction} onpress={() => onsave?.()} />
        <Button label="Cancel" size="md" tip="quick.cancel_store" {tipAction} onpress={() => oncancel?.()} />
      </span>
    {:else if readOnly}
      <span class="help warn-text">Quick Racks can't be changed: the file is from a newer yahaha, or there is no data folder.</span>
    {:else}
      <span class="help">
        <span class="line">Tap a rack to load it (asks first if unsaved) · Tap the lit one to recall it clean, changes kept as “Recovered: name”</span>
        <span class="line"
          >Long-press or right-click to save over it, the old one kept as “Previous: name” (Undo takes it back) · Launchkey: Shift +
          pads 9–12 = One Touch 1–4</span
        >
      </span>
    {/if}
  </div>
</section>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    box-sizing: border-box;
    width: var(--page-width, 1392px);
    height: var(--page-height, 288px);
    overflow: hidden;
    font-family: var(--font-sans);
    color: var(--t);
  }
  .group,
  .controls {
    display: flex;
    flex: none;
    align-items: baseline;
    gap: var(--space-8);
  }
  /* The header's 32px controls stand on its rule (they don't share its baseline). */
  .controls {
    align-items: center;
    align-self: flex-end;
    margin-bottom: var(--space-2);
  }
  .gap {
    width: var(--space-8);
  }
  .cap {
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .value {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    font-variant-numeric: tabular-nums;
  }

  /* ---- Slots: eight in one row, filling what the rows above and below leave. */
  .slots {
    display: grid;
    flex: 1 1 auto;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: var(--space-8);
    min-height: 0;
  }
  .cell {
    --hue: var(--neutral);
    position: relative;
    isolation: isolate;
    min-width: 0;
  }
  .slot {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: var(--space-8) var(--space-10) var(--space-10);
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--hue);
    color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-align: left;
    cursor: pointer;
    -webkit-touch-callout: none;
    user-select: none;
  }
  .code {
    color: var(--caption-ink);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  .name {
    display: flex;
    align-items: baseline;
    gap: var(--space-6);
    max-width: 100%;
    margin-top: auto;
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    white-space: nowrap;
  }
  .text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dot {
    flex: none;
    font-size: var(--glyph-sm);
  }
  .word {
    min-height: 16px;
    margin-top: var(--space-2);
    color: var(--caption-ink);
    white-space: nowrap;
  }
  /* Empty: the outline faded, "Empty" in the caption ink. */
  .state-empty .slot {
    box-shadow: inset 0 0 0 var(--outline-width) var(--absent);
  }
  .state-empty .name {
    color: var(--caption-ink);
    font: var(--type-text);
  }
  /* Missing: the name and ⚠ in the warning hue. */
  .state-missing .name,
  .state-missing .word {
    color: var(--warn);
  }
  /* Loaded (the live rack): a solid neutral block, everything in --on-ink. */
  .face-chosen .slot {
    background: var(--neutral);
    color: var(--on-ink);
  }
  .face-chosen .code,
  .face-chosen .name,
  .face-chosen .word {
    color: var(--on-ink);
  }
  /* Waiting (a store target): a 2px ring over a faint fill of the hue, under the text. */
  .face-waiting .slot {
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--hue);
  }
  .face-waiting .slot::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--hue);
    opacity: var(--wait-fill-opacity);
  }
  .waits .word {
    color: var(--value-ink);
  }
  .disabled .slot {
    box-shadow: inset 0 0 0 var(--outline-width) var(--absent);
    cursor: default;
  }
  .slot:focus-visible,
  .clear:focus-visible,
  .ots-button:focus-visible,
  .field:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }
  /* The clear ✕: a 32px square in the Ending hue at the slot's top right. */
  .clear {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    width: var(--control-height);
    height: var(--control-height);
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ending);
    font: var(--type-text);
    cursor: pointer;
  }
  .face-chosen .clear {
    color: var(--on-ink);
  }

  /* ---- One Touch: four OTS, each a button and what it loads. */
  .ots {
    display: grid;
    flex: none;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-16);
    height: 40px;
  }
  .ots-cell {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-4);
    min-width: 0;
  }
  .ots-button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 0;
    box-sizing: border-box;
    min-width: 0;
    margin: 0;
    padding: 0 var(--space-10);
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--neutral);
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .ots-name,
  .ots-code {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ots-code {
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .ots-code.missing {
    color: var(--warn);
  }
  .ots-button.chosen {
    background: var(--neutral);
    color: var(--on-ink);
  }
  .ots-button.chosen .ots-code {
    color: var(--on-ink);
  }
  .ots-button.absent {
    box-shadow: inset 0 0 0 var(--outline-width) var(--absent);
    color: var(--absent);
    cursor: default;
  }
  .ots-button.absent .ots-code {
    color: var(--absent);
  }
  .picker {
    position: relative;
    display: flex;
    min-width: 0;
  }
  .field {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0 var(--space-10);
    border: 0;
    border-radius: var(--radius);
    background: var(--g);
    box-shadow: inset 0 0 0 var(--outline-width) var(--neutral);
    color: var(--neutral);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  select.field {
    appearance: none;
    padding-right: var(--space-24);
    text-overflow: ellipsis;
    cursor: pointer;
  }
  select.field:disabled {
    box-shadow: inset 0 0 0 var(--outline-width) var(--absent);
    color: var(--absent);
    cursor: default;
  }
  .picker.missing select.field {
    color: var(--warn);
  }
  select.field option {
    background: var(--g);
    color: var(--value-ink);
  }
  .caret {
    position: absolute;
    top: 50%;
    right: var(--space-8);
    transform: translateY(-50%);
    color: var(--neutral);
    font-size: var(--glyph-sm);
    pointer-events: none;
  }

  /* ---- Foot: the legend at the left, then the help, the waiting Store's Save, or why it's read-only. */
  .foot {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--space-24);
    height: var(--control-height);
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    white-space: nowrap;
  }
  .legend {
    display: flex;
    flex: none;
    gap: var(--space-16);
  }
  .key {
    display: inline-flex;
    align-items: center;
    gap: var(--space-6);
  }
  .swatch {
    position: relative;
    isolation: isolate;
    box-sizing: border-box;
    width: 10px;
    height: 10px;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 var(--outline-width) var(--neutral);
  }
  .swatch.loaded {
    background: var(--neutral);
  }
  .swatch.empty {
    box-shadow: inset 0 0 0 var(--outline-width) var(--absent);
  }
  .swatch.armed {
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--neutral);
  }
  /* The help: two lines, right-aligned, in the foot's 32px. */
  .help {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 0;
    margin-left: auto;
  }
  .line {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .warn-text {
    color: var(--warn);
  }
  .ask {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    margin-left: auto;
    min-width: 0;
  }
  .say {
    color: var(--value-ink);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .say b {
    font: var(--type-strong);
  }
  .field.name {
    width: 200px;
    height: var(--control-height);
    color: var(--value-ink);
  }
</style>
