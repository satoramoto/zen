<!--
  Looper: the Chord Looper display page, in the Stage's display box (1392 × 288, `--page-width` ×
  `--page-height`). Record the chords you play, loop them for the left hand, keep them in eight
  memories of a bank (Looper-Dark.dc.html, without its now-playing block).

  - The header: "Chord Looper", the bank's name, and New bank, Load… (a list of the bank files,
    then From a file…, a bank file anywhere in the system file picker) and
    Save as… (an inline name field; Overwrite when another bank has that name).
  - The lane: the loop bar by bar, eight at a time: while looping or recording the window that
    holds the current bar; otherwise the window `laneFirst` picks, paged with ◀ ▶ (shown in a loop
    longer than eight bars, resting while the lane follows the playing bar). Each
    bar's number over a 2px line, then its chords at the large size. The current bar and its
    playhead take the state's face: lime while looping, red while recording; armed outlines bar 1
    in the hue it waits for; past bars grey, coming bars white; empty slots dashes.
  - Rec / Stop (record red: solid while recording, ring while armed) and On / Off (lime: solid while
    looping, ring while armed), the hardware code under each; the five-state readout, the current
    one lit; a line saying what happens next.
  - Memories 1–8: the loaded one is the white chosen block, the one taking over at the next bar a
    lime ring. Memory and Clear are latches: press one (lime), then a number.

  One face per state everywhere (the owner's call): recording red, playing lime, armed an outline,
  stopped white. Controlled: every value is a prop, every press a `LooperChange` through `onchange`.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import { barFace, barName, LANE_BARS, laneFollows, laneStart, lastWindow, loopFace, modeText, READOUT, windowStart } from './faces'
  import type { LooperChange, LooperPageData } from './types'

  type Props = LooperPageData & {
    /** The app's tooltip action (`use:tip`), applied to every control. */
    tipAction?: Action<HTMLElement, string>
    /** Called with what was pressed or typed. */
    onchange?: (change: LooperChange) => void
  }

  let {
    mode,
    hasData,
    bar,
    bars,
    sequence,
    laneFirst,
    playhead,
    running,
    memories,
    memory,
    pendingMemory,
    pick,
    bankName,
    bankSaved,
    bankPath,
    banks,
    loadOpen,
    saveAs,
    tipAction,
    onchange,
  }: Props = $props()

  const send = (c: LooperChange) => {
    // Paging by hand lets go of the window that was last playing.
    if (c.type === 'lanePage') held = null
    onchange?.(c)
  }

  function tipped(node: HTMLElement, key: string) {
    return tipAction?.(node, key)
  }

  const face = $derived(loopFace(mode, hasData))
  const recording = $derived(mode === 'recording' || mode === 'recArmed')
  const follows = $derived(laneFollows(mode))
  /** The window that was last playing: the lane stays on it when the loop stops, until paged. */
  let held = $state<number | null>(null)
  $effect.pre(() => {
    if (follows && bar !== null) held = windowStart(bar)
  })
  /** The lane's window: eight bars from `first`, following the playing bar, else held or paged. */
  const first = $derived(laneStart(mode, bar, bars, laneFirst, held))
  /** ◀ ▶ page the lane in a loop longer than eight bars; they rest while the lane follows. */
  const paging = $derived(bars > LANE_BARS)
  const slots = $derived(
    Array.from({ length: LANE_BARS }, (_, i) => {
      const n = first + i
      const item = sequence.find((b) => b.bar === n) ?? { bar: n, chords: [] }
      return { ...item, face: barFace(n, mode, bar, bars) }
    }),
  )
  const laneCaption = $derived(
    mode === 'recording'
      ? `Recording · ${bars} bar${bars === 1 ? '' : 's'}`
      : !bars
        ? 'Loop · empty'
        : bars > LANE_BARS
          ? `Loop · bars ${first}–${Math.min(bars, first + LANE_BARS - 1)} of ${bars}`
          : `Loop · ${bars} bar${bars === 1 ? '' : 's'}`,
  )
  const position = $derived(
    bar === null ? null : mode === 'looping' ? `${bar}/${bars}` : mode === 'recording' ? `${bar}` : null,
  )

  function nameKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (!saveAs?.clash) send({ type: 'save', overwrite: false })
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      send({ type: 'saveAsOpen', open: false })
    }
  }

  function listKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      send({ type: 'loadOpen', open: false })
    }
  }

  function focusOnMount(node: HTMLInputElement) {
    node.focus()
    node.select()
  }

  function focusIf(node: HTMLElement, first: boolean) {
    if (first) node.focus()
  }

  let root: HTMLElement | undefined = $state()

  /** A press outside the Load list (and its button) closes it. */
  function outside(event: PointerEvent) {
    if (!loadOpen || !(event.target instanceof Node)) return
    const list = root?.querySelector('#looper-banks')
    const opener = root?.querySelector('[aria-controls="looper-banks"]')
    if (list?.contains(event.target) || opener?.contains(event.target)) return
    send({ type: 'loadOpen', open: false })
  }

  function memoryName(i: number): string {
    const m = memories[i]
    const what = m.name ? `${m.name}, ${m.bars} bar${m.bars === 1 ? '' : 's'}${m.summary ? `: ${m.summary}` : ''}` : 'empty'
    const verb = pick === 'store' ? 'Store in memory' : pick === 'clear' ? 'Clear memory' : 'Memory'
    const state = memory === i ? ', loaded' : pendingMemory === i ? ', next' : ''
    return `${verb} ${i + 1}: ${what}${state}`
  }
</script>

<svelte:window onpointerdown={outside} />

<section class="looper" aria-label="Chord Looper" data-face={face} bind:this={root}>
  <GroupHeader title="Chord Looper">
    <span class="bank" data-tip="looper.bank" use:tipped={'looper.bank'}>
      <span class="bank-name">{bankName}</span>
      {#if !bankSaved}<span class="caption">not saved to a file</span>{/if}
    </span>
    <span class="actions">
      {#if saveAs}
        <span class="saveas" role="group" aria-label="Save the bank as">
          <input
            class="line-input"
            type="text"
            value={saveAs.name}
            placeholder={bankSaved ? bankName : 'Name this bank'}
            aria-label="Bank name"
            spellcheck="false"
            autocomplete="off"
            data-tip="looper.bank_name"
            use:tipped={'looper.bank_name'}
            use:focusOnMount
            oninput={(e) => send({ type: 'saveAsName', name: e.currentTarget.value })}
            onkeydown={nameKey}
          />
          {#if saveAs.clash}
            <span class="ask" role="alert">‘{saveAs.name.trim()}’ exists</span>
            <Button label="Overwrite" hue="ending" tip="looper.overwrite_bank" {tipAction} onpress={() => send({ type: 'save', overwrite: true })} />
          {:else}
            <Button label="Save" name="Save the bank" tip="looper.save_bank" {tipAction} onpress={() => send({ type: 'save', overwrite: false })} />
          {/if}
          <Button label="Cancel" name="Cancel saving" tip="looper.save_cancel" {tipAction} onpress={() => send({ type: 'saveAsOpen', open: false })} />
        </span>
      {:else}
        <Button label="New bank" tip="looper.new_bank" {tipAction} onpress={() => send({ type: 'newBank' })} />
        <Button
          label="Load…"
          name="Load a bank"
          popup="menu"
          expanded={loadOpen}
          controls="looper-banks"
          tip="looper.load_bank"
          {tipAction}
          onpress={() => send({ type: 'loadOpen', open: !loadOpen })}
        />
        <Button label="Save as…" name="Save the bank as" tip="looper.save_as" {tipAction} onpress={() => send({ type: 'saveAsOpen', open: true })} />
      {/if}
    </span>
  </GroupHeader>

  <div class="lane-wrap">
  <div class="lane-head">
    <span class="caption">{laneCaption}</span>
    <span class="lane-tools">
      {#if position}<span class="caption">Bar <span class="value">{position}</span></span>{/if}
      {#if paging}
        <span class="pager" role="group" aria-label="Page the loop">
          <Button
            symbol="prev"
            size="icon"
            name="Earlier bars"
            disabled={follows || first <= 1}
            tip="looper.lane_page"
            {tipAction}
            onpress={() => send({ type: 'lanePage', first: Math.max(1, first - LANE_BARS) })}
          />
          <Button
            symbol="next"
            size="icon"
            name="Later bars"
            disabled={follows || first >= lastWindow(bars)}
            tip="looper.lane_page"
            {tipAction}
            onpress={() => send({ type: 'lanePage', first: Math.min(lastWindow(bars), first + LANE_BARS) })}
          />
        </span>
      {/if}
    </span>
  </div>
  <div class="lane" role="list" aria-label="The loop, bar by bar" data-tip="looper.sequence" use:tipped={'looper.sequence'}>
    {#each slots as s (s.bar)}
      <div
        class="bar bar-{s.face}"
        role="listitem"
        aria-label={s.face === 'blank' ? `Bar ${s.bar}: empty` : barName(s)}
        aria-current={s.face === 'current' ? 'true' : undefined}
      >
        <span class="num">{s.bar}</span>
        <span class="rule"></span>
        <span class="chords">
          {#if s.face === 'blank' || (s.face === 'start' && !s.chords.length)}
            <span class="dash">–</span>
          {:else if s.chords.length}
            {s.chords.map((c) => c.chord).join(' ')}
          {:else if mode === 'recording'}
            {#if s.face === 'current'}<span class="rec-word">Rec</span>{:else}<span class="dash">·</span>{/if}
          {:else}
            <span class="hold">%</span>
          {/if}
        </span>
        {#if s.face === 'current' && playhead !== null}
          <span class="playhead" style:left="{Math.min(1, Math.max(0, playhead)) * 100}%"></span>
        {/if}
      </div>
    {/each}
  </div>
  </div>

  <div class="foot">
    <div class="lamps">
      <div class="lamp">
        <Button
          label="Rec / Stop"
          size="cell"
          hue="rec"
          on={mode === 'recording'}
          waiting={mode === 'recArmed'}
          pressed={mode === 'recording' || mode === 'recArmed'}
          name="Rec / Stop"
          tip="looper.rec"
          {tipAction}
          onpress={() => send({ type: 'rec' })}
        />
        <span class="caption">Shift + fader button 8</span>
      </div>
      <div class="lamp">
        <Button
          label="On / Off"
          size="cell"
          hue="lamp"
          on={mode === 'looping'}
          waiting={mode === 'loopArmed'}
          pressed={mode === 'looping' || mode === 'loopArmed'}
          name="On / Off"
          tip="looper.on_off"
          {tipAction}
          onpress={() => send({ type: 'onOff' })}
        />
        <span class="caption">Fader button 8</span>
      </div>
      <ul class="readout" aria-label="Loop state">
        {#each READOUT as r (r.mode)}
          {@const lit = r.mode === mode}
          {@const f = r.mode === 'off' && !hasData ? 'empty' : r.face}
          <li class="state" class:lit aria-current={lit ? 'true' : undefined}>
            <span class="swatch sw-{f}" aria-hidden="true"></span>{r.mode === 'off' && !hasData ? 'Empty' : r.label}
          </li>
        {/each}
      </ul>
      <p class="status" aria-live="polite">{modeText(mode, running, hasData)}</p>
    </div>

    <div class="memories" role="group" aria-label="Memories">
      <div class="mem-head">
        <span class="mem-title">Memories</span>
        <span class="caption hint" class:picking={pick !== null}>
          {pick === 'store' ? 'Store the loop in which memory?' : pick === 'clear' ? 'Clear which memory?' : 'Press Memory or Clear, then a number'}
        </span>
        <Button
          label="Memory"
          hue="lamp"
          on={pick === 'store'}
          pressed={pick === 'store'}
          name="Memory: store the loop"
          tip="looper.store"
          {tipAction}
          onpress={() => send({ type: 'pick', pick: pick === 'store' ? null : 'store' })}
        />
        <Button
          label="Clear"
          hue="lamp"
          on={pick === 'clear'}
          pressed={pick === 'clear'}
          name="Clear a memory"
          tip="looper.clear"
          {tipAction}
          onpress={() => send({ type: 'pick', pick: pick === 'clear' ? null : 'clear' })}
        />
      </div>
      <div class="cells">
        {#each memories as m, i (i)}
          {@const off = pick === null && recording}
          <button
            type="button"
            class="mem"
            class:chosen={memory === i && pick === null}
            class:waiting={pendingMemory === i || pick !== null}
            class:vacant={!m.name}
            class:off
            aria-disabled={off ? 'true' : undefined}
            aria-pressed={memory === i}
            aria-label={memoryName(i)}
            data-tip="looper.memory"
            use:tipped={'looper.memory'}
            onclick={() => !off && send({ type: 'memory', index: i })}
          >
            <span class="mem-num">{i + 1}</span>
            <span class="mem-name">{m.name ?? 'Empty'}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  {#if loadOpen}
    <div class="banks" id="looper-banks" role="menu" aria-label="Bank files" tabindex="-1" onkeydown={listKey}>
      {#each banks as b, i (b.path)}
        <button
          type="button"
          role="menuitem"
          class="bank-item"
          class:chosen={b.path === bankPath}
          aria-current={b.path === bankPath ? 'true' : undefined}
          data-tip="looper.load_bank"
          use:tipped={'looper.load_bank'}
          use:focusIf={i === 0}
          onclick={() => send({ type: 'load', path: b.path })}>{b.name}</button
        >
      {:else}
        <p class="caption none">No bank files yet: Save as… makes one.</p>
      {/each}
      <button
        type="button"
        role="menuitem"
        class="bank-item from-file"
        data-tip="looper.load_file"
        use:tipped={'looper.load_file'}
        use:focusIf={banks.length === 0}
        onclick={() => send({ type: 'loadFile' })}>From a file…</button
      >
    </div>
  {/if}
</section>

<style>
  .looper {
    /* The state's hue: the current bar, its playhead, the lit readout. */
    --state: var(--t);
    position: relative;
    display: grid;
    grid-template-rows: var(--group-header-height) auto 1fr;
    row-gap: var(--space-12);
    box-sizing: border-box;
    width: var(--page-width);
    height: var(--page-height);
    color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  .looper[data-face='rec'],
  .looper[data-face='recWait'] {
    --state: var(--rec);
  }
  .looper[data-face='play'],
  .looper[data-face='playWait'] {
    --state: var(--lamp-line);
  }
  .caption {
    color: var(--caption-ink);
  }
  .value {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    font-variant-numeric: tabular-nums;
  }

  /* ── Header ─────────────────────────────────────────────────────────────── */
  .bank {
    display: flex;
    align-items: baseline;
    gap: var(--space-12);
    min-width: 0;
  }
  .bank-name {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  /* Stands on the header's rule, as its tabs do; the buttons take the tabs' height. */
  .actions,
  .saveas {
    display: flex;
    align-items: center;
    align-self: flex-end;
    gap: var(--space-8);
    height: var(--tab-height-header);
    white-space: nowrap;
  }
  .actions {
    flex: none;
    margin-left: auto;
  }
  .actions :global(.btn) {
    height: var(--tab-height-header);
  }
  .ask {
    color: var(--t);
  }
  .line-input {
    box-sizing: border-box;
    width: 220px;
    height: 30px;
    margin: 0;
    padding: 0;
    border: 0;
    border-bottom: var(--line-width) solid var(--m);
    border-radius: 0;
    background: var(--g);
    color: var(--t);
    caret-color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    outline: none;
  }
  .line-input:focus {
    border-bottom-color: var(--t);
  }
  .line-input::placeholder {
    color: var(--m);
    opacity: 1;
  }

  /* ── The lane: eight bars on the grid's gutter ──────────────────────────── */
  .lane-wrap {
    display: grid;
    row-gap: var(--space-8);
  }
  .lane {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    column-gap: var(--grid-gutter, 18px);
  }
  .lane-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .lane-tools,
  .pager {
    display: flex;
    align-items: center;
    gap: var(--space-8);
  }
  /* ◀ ▶ at the compact height, so the lane's head stays a short row. */
  .pager :global(.btn) {
    height: var(--control-height-compact);
  }
  .bar {
    position: relative;
    display: grid;
    grid-template-rows: 16px var(--header-rule-width) 44px;
    row-gap: var(--space-8);
    min-width: 0;
    color: var(--t);
  }
  .num {
    color: var(--caption-ink);
  }
  .rule {
    background: var(--t);
  }
  .chords {
    overflow: hidden;
    font: var(--type-display);
    letter-spacing: var(--tracking-display);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hold,
  .dash {
    color: var(--d);
  }
  .bar-past {
    color: var(--m);
  }
  .bar-past .rule {
    background: var(--past);
  }
  .bar-blank .rule {
    background: var(--line);
  }
  .bar-current {
    color: var(--state);
  }
  .bar-current .num {
    color: var(--state);
  }
  .bar-current .rule {
    background: var(--state);
  }
  .rec-word {
    color: var(--rec);
  }
  /* Armed: a 1px outline in the hue it waits for around the bar it starts on, no playhead. */
  .bar-start {
    outline: var(--outline-width) solid var(--state);
    outline-offset: var(--space-4);
  }
  .bar-start .rule {
    background: var(--state);
  }
  .playhead {
    position: absolute;
    top: 24px;
    bottom: 0;
    width: var(--header-rule-width);
    margin-left: -1px;
    background: var(--state);
    pointer-events: none;
  }

  /* ── The foot: lamps and state on a third, memories on two ──────────────── */
  .foot {
    display: grid;
    grid-template-columns: var(--grid-span-5, 452px) minmax(0, 1fr);
    column-gap: var(--grid-gutter, 18px);
    align-items: end;
    align-self: end;
  }
  .lamps {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: var(--space-12);
    row-gap: var(--space-10);
  }
  .lamp {
    display: grid;
    row-gap: var(--space-4);
  }
  .readout {
    display: flex;
    grid-column: 1 / -1;
    justify-content: space-between;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .state {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    color: var(--caption-ink);
  }
  .state.lit {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  /* Each swatch draws its state's face, dimmed (absent) unless it is the one. */
  .swatch {
    box-sizing: border-box;
    width: 10px;
    height: 10px;
  }
  .sw-stopped {
    background: var(--absent-neutral);
  }
  .sw-empty {
    box-shadow: inset 0 0 0 var(--outline-width) var(--absent-neutral);
  }
  .sw-recWait {
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--absent-rec);
  }
  .sw-rec {
    background: var(--absent-rec);
  }
  .sw-playWait {
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--absent-lamp);
  }
  .sw-play {
    background: var(--absent-lamp);
  }
  .lit .sw-stopped {
    background: var(--t);
  }
  .lit .sw-empty {
    box-shadow: inset 0 0 0 var(--outline-width) var(--t);
  }
  .lit .sw-recWait {
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--rec);
  }
  .lit .sw-rec {
    background: var(--rec);
  }
  .lit .sw-playWait {
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--lamp-line);
  }
  .lit .sw-play {
    background: var(--lamp-line);
  }
  .status {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--t2);
  }

  /* Memories: eight cells, the loaded one the white chosen block. */
  .memories {
    display: grid;
    row-gap: var(--space-10);
  }
  .mem-head {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    height: var(--control-height);
  }
  .mem-title {
    margin-right: var(--space-4);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .hint {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hint.picking {
    color: var(--lamp-line);
  }
  .cells {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: var(--space-8);
  }
  .mem {
    position: relative;
    isolation: isolate;
    display: grid;
    align-content: space-between;
    justify-items: start;
    box-sizing: border-box;
    min-width: 0;
    height: 64px;
    margin: 0;
    padding: var(--space-8);
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    box-shadow: inset 0 0 0 var(--outline-width) var(--neutral);
    color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-align: left;
    cursor: pointer;
  }
  .mem-num {
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .mem-name {
    max-width: 100%;
    overflow: hidden;
    font-family: var(--font-mono);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mem.vacant {
    box-shadow: inset 0 0 0 var(--outline-width) var(--absent-neutral);
    color: var(--m);
  }
  .mem.waiting {
    box-shadow: inset 0 0 0 var(--outline-width-wait) var(--lamp-line);
  }
  .mem.waiting::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--lamp-line);
    opacity: var(--wait-fill-opacity);
  }
  .mem.chosen {
    background: var(--neutral);
    box-shadow: none;
    color: var(--on-ink);
  }
  .mem.chosen.waiting::before {
    content: none;
  }
  .mem.off {
    box-shadow: inset 0 0 0 var(--outline-width) var(--absent-neutral);
    color: var(--d);
    cursor: default;
  }
  .mem.off.chosen {
    background: var(--absent-neutral);
    color: var(--on-ink);
  }
  .mem:focus-visible,
  .bank-item:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: var(--focus-offset);
  }

  /* ── The Load list: under the header, at its right end ──────────────────── */
  .banks {
    position: absolute;
    z-index: 2;
    top: calc(var(--group-header-height) + var(--space-4));
    right: 0;
    display: grid;
    width: var(--grid-span-3, 264px);
    max-height: calc(var(--page-height) - var(--group-header-height) - var(--space-8));
    overflow-y: auto;
    box-sizing: border-box;
    padding: var(--space-4);
    background: var(--g);
    box-shadow: inset 0 0 0 var(--outline-width) var(--t);
  }
  .bank-item {
    box-sizing: border-box;
    height: var(--control-height);
    margin: 0;
    padding: 0 var(--space-12);
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-align: left;
    cursor: pointer;
  }
  .bank-item:hover {
    background: var(--btn);
  }
  .bank-item.chosen {
    background: var(--neutral);
    color: var(--on-ink);
  }
  .from-file {
    margin-top: var(--space-4);
    box-shadow: inset 0 var(--line-width) 0 var(--line);
    border-radius: 0;
  }
  .none {
    margin: 0;
    padding: var(--space-8) var(--space-12);
  }
</style>
