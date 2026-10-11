<!--
  SettingsChord: the Chord & Split page of the Settings screen. Three columns, each section in its
  own hue: Fingering (a radiogroup list, the chosen type a solid block), Left hand (the switches as
  lamps in settings rows, the chord-settle window) and Split point (− and +, Reset, "Set on the
  keys", the lock note, then who plays where). There is no page keyboard: the split is set on the
  main keyboard at the foot of the screen, by dragging its split line, or by "Set on the keys"
  (which arms a pick: the next key clicked there, black keys included, becomes the split). Off
  parts in Who plays where are drawn in their hue at absent strength. Controlled: it never changes
  `data`, it reports each change through `onchange`.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import LineSlider from '../LineSlider/LineSlider.svelte'
  import SettingsRow from '../SettingsRow/SettingsRow.svelte'
  import Stepper from '../Stepper/Stepper.svelte'
  import { SECTION_HUES, sectionHue } from '../Settings/hues'
  import type { ChordChange, ChordPageData } from '../Settings/types'

  type Props = {
    /** Everything the page shows. */
    data: ChordPageData
    /** The app's `use:tip` action, passed in by the wiring; applied to every control with a tooltip key. */
    tipAction?: Action<HTMLElement, string>
    /** Called with each change asked for; the page itself changes nothing. */
    onchange?: (change: ChordChange) => void
  }

  let { data, tipAction, onchange }: Props = $props()

  /** The Left hand rows' label column, px: fits "Manual Bass" and "Chord settle". */
  const LABEL_WIDTH = 96

  const radios: HTMLButtonElement[] = $state([])

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

  const send = (change: ChordChange) => onchange?.(change)

  function fingeringKey(event: KeyboardEvent, index: number) {
    const count = data.fingerings.length
    const to: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: count - 1,
    }
    if (!(event.key in to) || count === 0) return
    event.preventDefault()
    const target = (to[event.key] + count) % count
    radios[target]?.focus()
    if (data.fingerings[target].id !== data.fingering) send({ type: 'fingering', id: data.fingerings[target].id })
  }
</script>

<div class="page">
  <section class="group" aria-labelledby="chord-fingering" style={sectionHue(SECTION_HUES.chord.fingering)}>
    <GroupHeader title="Fingering" level={3} id="chord-fingering" />
    <div class="fingerings" role="radiogroup" aria-labelledby="chord-fingering">
      {#each data.fingerings as item, i (item.id)}
        {@const chosen = item.id === data.fingering}
        <button
          type="button"
          class="fingering"
          class:chosen
          role="radio"
          aria-checked={chosen}
          tabindex={chosen || (i === 0 && !data.fingerings.some((f) => f.id === data.fingering)) ? 0 : -1}
          data-tip={item.tip}
          bind:this={radios[i]}
          use:tipped={item.tip}
          onclick={() => {
            if (!chosen) send({ type: 'fingering', id: item.id })
          }}
          onkeydown={(e) => fingeringKey(e, i)}
        >
          <span class="name">{item.label}</span>
          <span class="line">{item.line}</span>
        </button>
      {/each}
    </div>
  </section>

  <section class="group" aria-labelledby="chord-left-hand" style={sectionHue(SECTION_HUES.chord.leftHand)}>
    <GroupHeader title="Left hand" level={3} id="chord-left-hand" />
    <SettingsRow label="Upper" hint="Chords from the right hand" labelWidth={LABEL_WIDTH}>
      <LampButton
        label={data.upper ? 'On' : 'Off'}
        on={data.upper}
        size="sm"
        width={64}
        name="Upper: read chords right of the split"
        tip="detection.upper"
        {tipAction}
        ontoggle={(on) => send({ type: 'upper', on })}
      />
    </SettingsRow>
    <SettingsRow label="Manual Bass" hint="Works with Upper on" labelWidth={LABEL_WIDTH}>
      <LampButton
        label={data.manualBass ? 'On' : 'Off'}
        on={data.manualBass}
        disabled={!data.upper}
        size="sm"
        width={64}
        name="Manual Bass, works with Upper on"
        tip="detection.manual_bass"
        {tipAction}
        ontoggle={(on) => send({ type: 'manualBass', on })}
      />
    </SettingsRow>
    <SettingsRow label="Left Hold" hint="Fader button 7" labelWidth={LABEL_WIDTH}>
      <LampButton
        label={data.leftHold ? 'On' : 'Off'}
        on={data.leftHold}
        size="sm"
        width={64}
        name="Left Hold: the chord holds when you lift"
        tip="detection.left_hold"
        {tipAction}
        ontoggle={(on) => send({ type: 'leftHold', on })}
      />
    </SettingsRow>
    <SettingsRow label="Chord settle" labelWidth={LABEL_WIDTH}>
      <LineSlider
        value={data.settleMs}
        min={0}
        max={data.settleMax}
        name="Chord settle window"
        unit="ms"
        tip="settings.chord_settle"
        {tipAction}
        onchange={(ms) => send({ type: 'settle', ms })}
      />
    </SettingsRow>
    <p class="help">
      How long yahaha waits for the rest of a chord before it changes. Longer is steadier, shorter is quicker. 0 to
      {data.settleMax} ms.
    </p>
  </section>

  <section class="group" aria-labelledby="chord-split" style={sectionHue(SECTION_HUES.chord.split)}>
    <GroupHeader title="Split point" level={3} id="chord-split">
      {#snippet end()}
        {#if data.splitLocked}<span class="locked">Locked</span>{/if}
      {/snippet}
    </GroupHeader>
    <div class="split-value">
      <Stepper
        value={data.splitName}
        unit={`MIDI ${data.split}`}
        size="large"
        nameDown="Split point one key down"
        nameUp="Split point one key up"
        tipDown="split.down"
        tipUp="split.up"
        atMin={data.split <= data.splitMin}
        atMax={data.split >= data.splitMax}
        {tipAction}
        ondown={() => send({ type: 'splitStep', delta: -1 })}
        onup={() => send({ type: 'splitStep', delta: 1 })}
      />
    </div>
    <div class="split-actions">
      <Button
        label={data.picking ? 'Click a key below…' : 'Set on the keys'}
        name={data.picking ? 'Set on the keys: click a key on the keyboard below, Esc cancels' : 'Set on the keys'}
        waiting={data.picking}
        pressed={data.picking}
        disabled={data.splitLocked}
        tip="settings.split_pick"
        {tipAction}
        onpress={() => send({ type: 'pick', armed: !data.picking })}
      />
      <Button
        label={`Reset to ${data.splitDefaultName}`}
        disabled={data.split === data.splitDefault}
        tip="settings.split_reset"
        {tipAction}
        onpress={() => send({ type: 'splitReset' })}
      />
    </div>
    {#if data.splitLocked}
      <div class="split-lock">
        <Button
          label={`A rack keeps ${data.splitName} · Keyboard page`}
          name={`Split point is locked: a rack keeps ${data.splitName}. Opens the Keyboard page`}
          tip="settings.split_lock_link"
          {tipAction}
          onpress={() => send({ type: 'openKeyboard' })}
        />
      </div>
    {/if}
    <p class="help">
      Chords read {data.upper ? 'right' : 'left'} of the split. Or drag the split line on the keys below; any key,
      black keys too.
    </p>
    <h4 class="subhead">Who plays where</h4>
    <div class="zones">
      {#each data.zones as zone (zone.part)}
        <div class="zone" class:off={!zone.on} data-hue={zone.hue}>
          <span class="side">{zone.side ?? ''}</span>
          <span class="tag">{zone.part}</span>
          <span class="program">{zone.program}</span>
          <span class="sound">{zone.sound}</span>
          <span class="state">{zone.state}</span>
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .page {
    /* The page area's sizes, which the scale lacks: the first two columns and Who plays where's. */
    --chord-col-fingering: 280px;
    --chord-col-left: 384px;
    --chord-fingering-height: 44px;
    --chord-zone-side: 48px;
    --chord-zone-tag: 28px;
    --chord-zone-program: 24px;
    display: grid;
    grid-template-columns: var(--chord-col-fingering) var(--chord-col-left) minmax(0, 1fr);
    column-gap: var(--space-24);
    align-items: start;
    box-sizing: border-box;
    width: 100%;
    color: var(--value-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    font-variant-numeric: tabular-nums;
  }
  .group {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* Fingering: a list of two-line rows; the chosen one a solid block in the section's hue. */
  .fingerings {
    display: flex;
    flex-direction: column;
  }
  .fingering {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-2);
    box-sizing: border-box;
    width: 100%;
    height: var(--chord-fingering-height);
    margin: 0;
    padding: 0 var(--space-10);
    border: 0;
    border-bottom: var(--line-width) solid var(--line);
    border-radius: var(--radius);
    background: transparent;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .fingering .name {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .fingering .line {
    overflow: hidden;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-overflow: ellipsis;
  }
  .fingering.chosen {
    background: var(--neutral);
  }
  .chosen .name,
  .chosen .line {
    color: var(--on-ink);
  }
  .fingering:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--focus-offset));
  }

  .help {
    margin: var(--space-12) 0 0;
    color: var(--caption-ink);
  }

  /* Split point. */
  .locked {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .split-value {
    padding: var(--space-12) 0 var(--space-8);
  }
  .split-actions,
  .split-lock {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
  }
  .split-lock {
    margin-top: var(--space-8);
  }
  .subhead {
    margin: var(--space-20) 0 0;
    padding-bottom: var(--space-6);
    border-bottom: var(--line-width) solid var(--line);
    color: var(--header-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .zone {
    --zone-hue: var(--neutral);
    display: grid;
    grid-template-columns: var(--chord-zone-side) var(--chord-zone-tag) var(--chord-zone-program) minmax(0, 1fr) auto;
    align-items: center;
    column-gap: var(--space-8);
    min-height: var(--control-height-compact);
    border-bottom: var(--line-width) solid var(--line);
    white-space: nowrap;
  }
  .zone[data-hue='r1'] {
    --zone-hue: var(--r1);
  }
  .zone[data-hue='r2'] {
    --zone-hue: var(--r2);
  }
  .zone[data-hue='r3'] {
    --zone-hue: var(--r3);
  }
  .zone[data-hue='l'] {
    --zone-hue: var(--l);
  }
  .zone.off[data-hue='r1'] {
    --zone-hue: var(--absent-r1);
  }
  .zone.off[data-hue='r2'] {
    --zone-hue: var(--absent-r2);
  }
  .zone.off[data-hue='r3'] {
    --zone-hue: var(--absent-r3);
  }
  .zone.off[data-hue='l'] {
    --zone-hue: var(--absent-l);
  }
  .side,
  .program,
  .state {
    color: var(--caption-ink);
  }
  .tag {
    color: var(--zone-hue);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .sound {
    overflow: hidden;
    color: var(--value-ink);
    text-overflow: ellipsis;
  }
  .off .sound,
  .off .program,
  .off .state {
    color: var(--caption-ink);
  }
</style>
