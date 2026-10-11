<!--
  SettingsKeyboard: the Settings screen's Keyboard page, in two halves, each a section in its own
  hue (`SECTION_HUES.keyboard`). Left, Transpose: Keyboard and Master, each a large Stepper (−12 to
  +12 semitones) with a line on what it moves, then what a C sounds as and Reset both to 0 (under
  Master's column; shown, not pressable, while both are 0), then the hardware note. Right,
  Parameter lock: the Split point and Fingering type lamps, what a lock does, and the read-only
  list of what a rack recall sets under its own sub-header. One text size on every line. The
  Screen draws the page's title and caption. Controlled: every press is reported through
  `onchange`; the data never changes here.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import SettingsRow from '../SettingsRow/SettingsRow.svelte'
  import Stepper from '../Stepper/Stepper.svelte'
  import { SECTION_HUES, sectionHue } from '../Settings/hues'
  import type { KeyboardChange, KeyboardPageData } from '../Settings/types'

  type Props = {
    /** The page's values: both transposes, what a C sounds as, the two locks and the split point's name. */
    data: KeyboardPageData
    /** The app's `use:tip` action, passed to every control. */
    tipAction?: Action<HTMLElement, string>
    /** A control was pressed: a transpose step, Reset, or a lock switched. */
    onchange?: (change: KeyboardChange) => void
  }

  let { data, tipAction, onchange }: Props = $props()
  const uid = $props.id()

  const MIN = -12
  const MAX = 12

  /** "+2", "0", "−3" (a real minus sign). */
  function signed(n: number): string {
    return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0'
  }

  /** What a rack recall sets, from racks.md "The model"; only the split point follows its lock. */
  let recall = $derived([
    { what: 'Four parts: sounds and mix', does: 'Loads' },
    { what: 'Split point', does: data.lockSplit ? 'Kept · locked' : 'Loads' },
    { what: 'Fingering type', does: 'Not in a rack' },
    { what: 'Harmony / Arpeggio', does: 'Loads' },
    { what: 'Transpose', does: 'Loads' },
    { what: 'Controller map and send effects', does: 'Loads' },
    { what: 'Style, tempo, style parts, Multi Pads', does: 'Not in a rack' },
  ])

  let atZero = $derived(data.transposeKeyboard === 0 && data.transposeMaster === 0)
</script>

<div class="page">
  <section class="half" aria-label="Transpose" style={sectionHue(SECTION_HUES.keyboard.transpose)}>
    <GroupHeader title="Transpose" level={3}>
      {#snippet end()}<span class="caption">Also on <span class="value">Pads · Chord page</span></span>{/snippet}
    </GroupHeader>
    <div class="pair">
      <div class="unit">
        <span class="name">Keyboard</span>
        <Stepper
          value={signed(data.transposeKeyboard)}
          unit="semitones"
          size="large"
          nameDown="Keyboard transpose down a semitone"
          nameUp="Keyboard transpose up a semitone"
          tipDown="transpose.keyboard_down"
          tipUp="transpose.keyboard_up"
          atMin={data.transposeKeyboard <= MIN}
          atMax={data.transposeKeyboard >= MAX}
          {tipAction}
          ondown={() => onchange?.({ type: 'keyboardStep', delta: -1 })}
          onup={() => onchange?.({ type: 'keyboardStep', delta: 1 })}
        />
        <p class="line">Moves what your hands play, and the chord the band follows. Your parts only.</p>
        <span class="caption">Range <span class="value">−12 to +12</span></span>
      </div>
      <div class="unit">
        <span class="name">Master</span>
        <Stepper
          value={signed(data.transposeMaster)}
          unit="semitones"
          size="large"
          nameDown="Master transpose down a semitone"
          nameUp="Master transpose up a semitone"
          tipDown="transpose.master_down"
          tipUp="transpose.master_up"
          atMin={data.transposeMaster <= MIN}
          atMax={data.transposeMaster >= MAX}
          {tipAction}
          ondown={() => onchange?.({ type: 'masterStep', delta: -1 })}
          onup={() => onchange?.({ type: 'masterStep', delta: 1 })}
        />
        <p class="line">Moves everything that sounds: your hands and the whole band.</p>
        <span class="caption">Range <span class="value">−12 to +12</span></span>
      </div>
    </div>
    <!-- Same two columns as Keyboard and Master: the readout under Keyboard, Reset under Master. -->
    <div class="hear">
      <span class="readout">
        <span class="caption">You play</span>
        <span class="note">{data.youPlay}</span>
        <span class="caption" aria-hidden="true">→</span>
        <span class="caption">you hear</span>
        <span class="note">{data.youHear}</span>
      </span>
      <span class="reset">
        <Button
          label="Reset both to 0"
          tip="transpose.reset"
          disabled={atZero}
          {tipAction}
          onpress={() => onchange?.({ type: 'reset' })}
        />
      </span>
    </div>
    <p class="help">
      Chord pad page: <span class="value">Kbd Tr −</span> · <span class="value">Kbd Tr +</span> ·
      <span class="value">Tr Reset</span>. Master has no hardware control.
    </p>
  </section>

  <section class="half" aria-label="Parameter lock" style={sectionHue(SECTION_HUES.keyboard.lock)}>
    <GroupHeader title="Parameter lock" level={3}>
      {#snippet end()}<span class="caption">Applies to <span class="value">Quick Racks · One Touch</span></span>{/snippet}
    </GroupHeader>
    <div class="rows">
      <SettingsRow label="Split point" hint={data.lockSplit ? `Stays at ${data.splitName}` : ''}>
        <LampButton
          label={data.lockSplit ? 'On' : 'Off'}
          on={data.lockSplit}
          size="sm"
          width={64}
          name="Lock the split point"
          tip="settings.param_lock_split_point"
          {tipAction}
          ontoggle={(on) => onchange?.({ type: 'lock', item: 'splitPoint', on })}
        />
      </SettingsRow>
      <SettingsRow label="Fingering type" hint="Fingering: not in a rack">
        <LampButton
          label={data.lockFingering ? 'On' : 'Off'}
          on={data.lockFingering}
          size="sm"
          width={64}
          name="Lock the fingering type"
          tip="settings.param_lock_fingering_type"
          {tipAction}
          ontoggle={(on) => onchange?.({ type: 'lock', item: 'fingeringType', on })}
        />
      </SettingsRow>
    </div>
    <p class="help">
      A locked setting stays as it is when you recall a Quick Rack or a One Touch Setting. A locked split point
      can't be dragged on the keys either; − and + on the Chord & Split page still move it. A rack recall sets
      only the split point.
    </p>
    <div class="sub" role="group" aria-labelledby="{uid}-recall">
      <GroupHeader title="A rack recall sets" level={4} id="{uid}-recall" />
      <dl class="recall">
        {#each recall as item (item.what)}
          <div class="item">
            <dt>{item.what}</dt>
            <dd>{item.does}</dd>
          </div>
        {/each}
      </dl>
    </div>
  </section>
</div>

<style>
  .page {
    --settings-page-width: 1048px; /* the Settings screen's page area */
    --settings-half-gap: 40px; /* the gap between the two halves (the board's) */
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: var(--settings-half-gap);
    align-items: start;
    box-sizing: border-box;
    width: var(--settings-page-width);
    max-width: 100%;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    color: var(--value-ink);
  }
  .half {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .caption {
    color: var(--caption-ink);
  }
  .value {
    color: var(--value-ink);
  }
  p {
    margin: 0;
  }
  /* Keyboard | Master, and the readout | Reset line under them: one grid, one gap. */
  .pair,
  .hear {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: var(--space-24);
  }
  .pair {
    margin-top: var(--header-gap);
  }
  .unit {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-8);
    min-width: 0;
  }
  /* A unit's name: the section's hue, at the one text size. */
  .name {
    color: var(--header-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .line {
    color: var(--caption-ink);
  }
  .hear {
    align-items: center;
    min-height: var(--group-header-height);
    margin-top: var(--space-24);
    padding-top: var(--space-12);
    border-top: var(--line-width) solid var(--line);
  }
  .readout {
    display: flex;
    align-items: baseline;
    gap: var(--space-8);
    min-width: 0;
    white-space: nowrap;
  }
  .note {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .reset {
    display: flex;
    min-width: 0;
  }
  .help {
    margin-top: var(--space-12);
    color: var(--caption-ink);
  }
  .rows {
    display: flex;
    flex-direction: column;
    margin-top: var(--space-4);
  }
  .sub {
    display: flex;
    flex-direction: column;
    margin-top: var(--space-24);
  }
  .recall {
    margin: var(--space-4) 0 0;
  }
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-12);
    min-height: var(--control-height-compact);
    border-bottom: var(--line-width) solid var(--line);
  }
  dt {
    min-width: 0;
    color: var(--value-ink);
  }
  dd {
    flex: none;
    margin: 0;
    color: var(--caption-ink);
  }
</style>
