<!--
  MultiPads: the Multi Pads display page, in the Stage's display box (`--page-width` ×
  `--page-height`, 1392 × 288). Three columns, each a group header over its controls:
  - Banks: the bank pager (◀ ▶, the bank's place in the list), Load… (a `.pad` file anywhere, in
    the system file picker) and Clear bank, then why Load… failed (`data.error`, when it did), over the list of every bank (a FolderList: the name, its folder at the right; the loaded one chosen).
  - Multi Pads: the bank's name in the accent block, then the four pads as columns. Each has a
    caption (Pad n, its channel, its lamp word in the lamp's hue), the pad itself in the band's pad
    language (ready: the Fill hue's outline; playing: solid Ending red; queued: Intro gold's waiting
    ring and NEXT; armed: Ending red's waiting ring and ARMED, both flashing on `lit`; empty: absent),
    then Select (Synchro Start standby, lit while armed) and Stop, Repeat and Chord Match.
  - All pads: Stop all, the Multi Pad volume (Panel fader 6), Synchro Stop's two switches, and
    one line saying what a press does now and what Synchro Stop does.
  Controlled: it draws `data` and reports each request through `onchange`; nothing is its own.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import AccentBlock from '../AccentBlock/AccentBlock.svelte'
  import Button from '../Button/Button.svelte'
  import FolderList from '../FolderList/FolderList.svelte'
  import type { FolderItem } from '../FolderList/types'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import LineSlider from '../LineSlider/LineSlider.svelte'
  import Pad from '../Pad/Pad.svelte'
  import type { MultiPadItem, MultiPadLamp, MultiPadsChange, MultiPadsData } from './types'

  type Props = {
    /** Everything the page draws: the banks, the four pads, the volume and Synchro Stop. */
    data: MultiPadsData
    /** The app's `use:tip` action, passed to every control. */
    tipAction?: Action<HTMLElement, string>
    /** Called with what a control asks for. The page itself changes nothing. */
    onchange?: (change: MultiPadsChange) => void
  }

  let { data, tipAction, onchange }: Props = $props()

  const uid = $props.id()

  /** The computer keys of the pads (Shift + Z X C V). */
  const KEYS = ['⇧Z', '⇧X', '⇧C', '⇧V']

  /** Each lamp in the band's pad language: its family (hue), face and word. */
  const LAMPS: Record<MultiPadLamp, { family: 'fill' | 'ending' | 'intro'; face: 'idle' | 'dark' | 'playing' | 'next' | 'armed'; word: string }> = {
    empty: { family: 'fill', face: 'dark', word: 'Empty' },
    ready: { family: 'fill', face: 'idle', word: 'Ready' },
    playing: { family: 'ending', face: 'playing', word: 'Playing' },
    queued: { family: 'intro', face: 'next', word: 'Next bar' },
    armed: { family: 'ending', face: 'armed', word: 'Armed' },
  }

  const send = (change: MultiPadsChange) => onchange?.(change)

  const items = $derived<FolderItem[]>(data.banks.map((b) => ({ id: b.id, label: b.name, count: b.folder, tip: 'multipad.bank' })))
  const place = $derived(data.bank === null ? -1 : data.banks.findIndex((b) => b.id === data.bank))
  const busy = $derived(data.pads.some((p) => p.lamp === 'playing' || p.lamp === 'queued' || p.lamp === 'armed'))

  /** The bank `by` steps from the loaded one (from the ends when none is loaded), wrapping. */
  function step(by: number) {
    const n = data.banks.length
    if (n === 0) return
    const at = place < 0 ? (by > 0 ? -1 : n) : place
    send({ type: 'bank', id: data.banks[(((at + by) % n) + n) % n].id })
  }

  const pressText = $derived(data.running ? 'The band is playing: a pad starts at the next bar line.' : 'The band is stopped: a pad starts at once.')
  const syncText = $derived.by(() => {
    const s = data.synchroStop
    const when = [s.styleStop && 'the band stops', s.ending && 'an Ending starts'].filter(Boolean).join(' or ')
    return when ? `Looping pads stop when ${when}; one-shots play out.` : 'Looping pads play on until you stop them.'
  })

  const empty = (p: MultiPadItem) => p.lamp === 'empty'
</script>

<div class="page" role="region" aria-label="Multi Pads page">
  <!-- Banks ────────────────────────────────────────────────────────────── -->
  <section class="banks" aria-labelledby="{uid}-banks">
    <GroupHeader title="Banks" level={3} id="{uid}-banks" count={{ label: 'Bank', value: place < 0 ? `–/${data.banks.length}` : `${place + 1}/${data.banks.length}` }} />
    <div class="tools">
      <Button symbol="prev" size="icon" name="Previous bank" join="start" disabled={data.banks.length === 0} tip="multipad.bank_prev" {tipAction} onpress={() => step(-1)} />
      <Button symbol="next" size="icon" name="Next bank" join="end" disabled={data.banks.length === 0} tip="multipad.bank_next" {tipAction} onpress={() => step(1)} />
      <span class="grow"></span>
      <span class="files">
        <Button label="Load…" name="Load a bank file" tip="multipad.load_file" {tipAction} onpress={() => send({ type: 'loadFile' })} />
        <Button label="Clear bank" hue="ending" disabled={data.bank === null} tip="multipad.clear_bank" {tipAction} onpress={() => send({ type: 'clear' })} />
      </span>
    </div>
    {#if data.error}
      <p class="error" role="alert">{data.error}</p>
    {/if}
    <div class="list">
      {#if items.length === 0}
        <p class="note">No .pad files in the style folders. Put Multi Pad banks there and rescan in Settings › System.</p>
      {:else}
        <FolderList {items} chosen={data.bank} label="Multi Pad banks" {tipAction} onchoose={(id) => send({ type: 'bank', id })} />
      {/if}
    </div>
  </section>

  <!-- The four pads ────────────────────────────────────────────────────── -->
  <section class="pads" aria-labelledby="{uid}-pads">
    <GroupHeader title="Multi Pads" level={3} id="{uid}-pads">
      <AccentBlock label={data.bankName} empty="No bank" size="knob" />
      {#snippet end()}
        <span class="caption">{data.loading ? 'Loading…' : 'Keys ⇧Z ⇧X ⇧C ⇧V · ⇧B stops all'}</span>
      {/snippet}
    </GroupHeader>
    <div class="grid">
      {#each data.pads as p, i (i)}
        {@const lamp = LAMPS[p.lamp]}
        <div class="col" role="group" aria-label="Pad {i + 1}">
          <div class="cap">
            <span class="value">Pad {i + 1}</span>
            <span class="caption">{KEYS[i]} · ch {p.channel}</span>
            <span class="grow"></span>
            <span class="word" style:color="var(--{p.lamp === 'empty' ? 'm' : lamp.family})" data-lamp={p.lamp}>{lamp.word}</span>
          </div>
          <div class="face">
            <Pad
              label={p.name || 'Empty'}
              family={lamp.family}
              state={lamp.face}
              lit={data.lit}
              name="Pad {i + 1}: {p.name || 'empty'}, {lamp.word.toLowerCase()}"
              tip="multipad.pad{i + 1}"
              {tipAction}
              onpress={() => !empty(p) && send({ type: 'play', pad: i })}
            />
          </div>
          <div class="pair">
            <LampButton
              label="Select"
              size="cell"
              on={p.lamp === 'armed'}
              disabled={empty(p)}
              name="Select pad {i + 1}: Synchro Start"
              tip="multipad.arm{i + 1}"
              {tipAction}
              ontoggle={() => send({ type: 'select', pad: i })}
            />
            <Button label="Stop" size="cell" disabled={empty(p)} name="Stop pad {i + 1}" tip="multipad.stop{i + 1}" {tipAction} onpress={() => send({ type: 'stop', pad: i })} />
          </div>
          <LampButton label="Repeat" size="cell" on={p.repeat} disabled={empty(p)} name="Repeat pad {i + 1}" tip="multipad.repeat" {tipAction} ontoggle={(on) => send({ type: 'repeat', pad: i, on })} />
          <LampButton label="Chord Match" size="cell" on={p.chordMatch} disabled={empty(p)} name="Chord Match pad {i + 1}" tip="multipad.chord_match" {tipAction} ontoggle={(on) => send({ type: 'chordMatch', pad: i, on })} />
        </div>
      {/each}
    </div>
  </section>

  <!-- All pads ─────────────────────────────────────────────────────────── -->
  <section class="all" aria-labelledby="{uid}-all">
    <GroupHeader title="All pads" level={3} id="{uid}-all" />
    <div class="rows">
      <div class="row">
        <span class="label caption">Pads</span>
        <Button label="Stop all" hue={busy ? 'ending' : 't'} waiting={busy} tip="multipad.stop_all" {tipAction} onpress={() => send({ type: 'stopAll' })} />
      </div>
      <div class="row">
        <span class="label caption">Volume</span>
        <LineSlider value={data.volume} name="Multi Pad volume" width={136} tip="mixer.pad_level" {tipAction} onchange={(volume) => send({ type: 'volume', volume })} />
        <span class="caption" class:wait={data.volumeWaiting}>{data.volumeWaiting ? 'Fader 6 ↕ pick up' : 'Fader 6'}</span>
      </div>
      <div class="row">
        <span class="label caption">Synchro Stop</span>
        <LampButton
          label="Style stops"
          size="sm"
          on={data.synchroStop.styleStop}
          tip="multipad.synchro_stop"
          {tipAction}
          ontoggle={(on) => send({ type: 'synchroStop', styleStop: on, ending: data.synchroStop.ending })}
        />
        <LampButton
          label="At the ending"
          size="sm"
          on={data.synchroStop.ending}
          tip="multipad.synchro_at_ending"
          {tipAction}
          ontoggle={(on) => send({ type: 'synchroStop', styleStop: data.synchroStop.styleStop, ending: on })}
        />
      </div>
      <p class="note">{pressText} {syncText}</p>
    </div>
  </section>
</div>

<style>
  .page {
    display: grid;
    grid-template-columns: 280px 692px 1fr;
    column-gap: var(--space-20);
    box-sizing: border-box;
    width: var(--page-width, 1392px);
    height: var(--page-height, 288px);
    overflow: hidden;
    color: var(--t);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  section {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .caption {
    color: var(--caption-ink);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .value {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .grow {
    flex: 1;
  }
  .note {
    margin: 0;
    color: var(--caption-ink);
  }

  /* Banks */
  .tools {
    display: flex;
    align-items: center;
    margin-top: var(--header-gap);
  }
  .files {
    display: flex;
    gap: var(--space-6);
  }
  .error {
    margin: var(--space-8) 0 0;
    color: var(--warn);
  }
  .list {
    flex: 1;
    min-height: 0;
    margin-top: var(--space-8);
  }

  /* Pads: four columns of 164 */
  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    column-gap: var(--space-12);
    margin-top: var(--header-gap);
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    min-width: 0;
  }
  .cap {
    display: flex;
    align-items: baseline;
    gap: var(--space-6);
    white-space: nowrap;
  }
  .face {
    --pad-width: 100%;
    --pad-height: 104px;
    display: flex;
    margin-bottom: var(--space-2);
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: var(--space-6);
  }

  /* All pads */
  .rows {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    margin-top: var(--header-gap);
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    min-height: var(--control-height);
  }
  .row .label {
    flex: none;
    width: 88px;
  }
  .wait {
    color: var(--warn);
  }
</style>
