<!--
  HarmArp: the Harm/Arp display page, in the Stage's display box (--page-width × --page-height,
  1392 × 288). Two sections, each in its own hue, as the Settings pages are:

  - Type (accent): the header names the selected type, its category caption and the HARMONY/
    ARPEGGIO switch (a lamp, fader button 5); under it the category tabs (Harmony, Echo, Multi
    Assign, then one per arpeggio category) and the grid of the viewed category's types, the
    selected one a solid block. A tab only browses (HA-D1): picking a type is what sends. With an
    arpeggio selected, its Quantize and Velocity rows stand at the section's foot.
  - Settings (Right 1 blue): the rows the selected type has: Assign and Volume always; Touch limit
    and Chord note only for a Harmony type; Speed and Touch limit for Echo, Tremolo and Trill; Hold
    (and the Hold pedal) and Keep Key On for an arpeggio; a note for Multi Assign, which has none.

  Controlled: it draws `data` as given, reports every click through `onchange` (the chosen value
  too: the wiring knows what is a no-op) and every category tab through `onview`.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import type { TabItem } from '../ChosenTabs/types'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import LineSlider from '../LineSlider/LineSlider.svelte'
  import SettingsRow from '../SettingsRow/SettingsRow.svelte'
  import { sectionHue } from '../Settings/hues'
  import type {
    HarmArpAssign,
    HarmArpCategory,
    HarmArpCategoryTab,
    HarmArpChange,
    HarmArpData,
    HarmArpQuantize,
    HarmArpSpeed,
    HarmArpVelocity,
  } from './types'

  type Props = {
    /** Everything the page shows. */
    data: HarmArpData
    /** The app's `use:tip` action, passed in by the wiring; applied to every control. */
    tipAction?: Action<HTMLElement, string>
    /** Called with each change asked for, the chosen value included; the page changes nothing itself. */
    onchange?: (change: HarmArpChange) => void
    /** Called with a category tab's category when it is clicked or arrowed to; sends nothing. */
    onview?: (category: HarmArpCategory) => void
  }

  let { data, tipAction, onchange, onview }: Props = $props()
  const uid = $props.id()

  /** The settings rows' label column, px: fits "Touch limit" and "Keep Key On". */
  const LABEL_WIDTH = 88

  const SPEEDS: HarmArpSpeed[] = ['1/4', '1/6', '1/8', '1/12', '1/16', '1/32']
  const ASSIGN: { id: HarmArpAssign; label: string; name: string }[] = [
    { id: 'auto', label: 'Auto', name: 'Auto' },
    { id: 'multi', label: 'Multi', name: 'Multi' },
    { id: 'right1', label: 'R1', name: 'Right 1' },
    { id: 'right2', label: 'R2', name: 'Right 2' },
    { id: 'right3', label: 'R3', name: 'Right 3' },
  ]
  const QUANTIZE: TabItem[] = [
    { id: 'off', label: 'Off', tip: 'harmony.arp_quantize' },
    { id: 'eighth', label: '1/8', tip: 'harmony.arp_quantize' },
    { id: 'sixteenth', label: '1/16', tip: 'harmony.arp_quantize' },
  ]
  const VELOCITY: TabItem[] = [
    { id: 'original', label: 'Pattern', tip: 'harmony.arp_velocity' },
    { id: 'thru', label: 'As played', tip: 'harmony.arp_velocity' },
    { id: 'fixed', label: 'Fixed', tip: 'harmony.arp_velocity' },
  ]
  const SETTINGS_TITLE = { harmony: 'Harmony settings', echo: 'Echo settings', multi: 'Multi Assign', arpeggio: 'Arpeggio settings' }

  const send = (change: HarmArpChange) => onchange?.(change)

  /** A category tab's id: its group and name, so a Harmony and an arpeggio name never collide. */
  const tabId = (c: HarmArpCategory) => `${c.group}:${c.name}`
  const noun = (group: HarmArpCategory['group'], n: number) =>
    group === 'harmony' ? (n === 1 ? 'type' : 'types') : n === 1 ? 'pattern' : 'patterns'

  function categoryTabs(tabs: HarmArpCategoryTab[]): TabItem[] {
    return tabs.map((t) => ({
      id: tabId(t),
      label: t.name,
      name: `${t.name}: ${t.count} ${noun(t.group, t.count)}${t.holdsSelected ? ', selected type here' : ''}`,
      tip: 'harmony.category',
    }))
  }

  function view(id: string, tabs: HarmArpCategoryTab[]) {
    const tab = tabs.find((t) => tabId(t) === id)
    if (tab) onview?.({ group: tab.group, name: tab.name })
  }

  const chosenTab = $derived(data.viewed ? tabId(data.viewed) : null)
  const harmonyTabs = $derived(categoryTabs(data.harmonyTabs))
  const arpTabs = $derived(categoryTabs(data.arpTabs))
  const arpKind = $derived(data.kind === 'arpeggio')
  const assignTabs = $derived(
    ASSIGN.filter((a) => !(arpKind && a.id === 'multi')).map((a) => ({ ...a, tip: 'harmony.assign' })),
  )
  const gridLabel = $derived(data.viewed ? `${data.viewed.name} ${noun(data.viewed.group, 2)}` : 'Types')
  const itemTip = $derived(data.viewed?.group === 'arpeggio' ? 'harmony.pattern' : 'harmony.type')
  const onOff = (on: boolean) => (on ? 'On' : 'Off')

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
</script>

<div class="page">
  <section class="types" aria-labelledby="{uid}-type" style={sectionHue('a')}>
    <GroupHeader title="Harmony / Arpeggio" id="{uid}-type">
      <span class="name" class:none={!data.typeName}>{data.typeName || '—'}</span>
      {#if data.caption}<span class="caption">{data.caption}</span>{/if}
      {#snippet end()}
        <LampButton
          label={onOff(data.on)}
          on={data.on}
          code="Fader button 5"
          size="sm"
          name="Harmony/Arpeggio {onOff(data.on).toLowerCase()} (fader button 5)"
          tip="harmony.switch"
          {tipAction}
          ontoggle={(on) => send({ type: 'on', on })}
        />
      {/snippet}
    </GroupHeader>

    <div class="categories">
      <ChosenTabs
        tabs={harmonyTabs}
        chosen={chosenTab}
        size="compact"
        label="Harmony categories"
        {tipAction}
        onchoose={(id) => view(id, data.harmonyTabs)}
      />
      <span class="divider" aria-hidden="true"></span>
      <span class="word">Arpeggio</span>
      <ChosenTabs
        tabs={arpTabs}
        chosen={chosenTab}
        size="compact"
        label="Arpeggio categories"
        {tipAction}
        onchoose={(id) => view(id, data.arpTabs)}
      />
    </div>

    <div class="grid" role="group" aria-label={gridLabel}>
      {#each data.items as item (item.index)}
        {@const chosen = item.index === data.selected}
        <button
          type="button"
          class="item"
          class:chosen
          aria-pressed={chosen}
          data-face={chosen ? 'chosen' : 'off'}
          data-tip={itemTip}
          use:tipped={itemTip}
          onclick={() => data.viewed && send({ type: 'pick', group: data.viewed.group, index: item.index })}
        >
          {item.name}
        </button>
      {/each}
    </div>

    {#if arpKind}
      <div class="foot">
        <SettingsRow label="Quantize" hint="Starts the pattern on the nearest step" labelWidth={LABEL_WIDTH}>
          <ChosenTabs
            tabs={QUANTIZE}
            chosen={data.arp.quantize}
            size="compact"
            label="Arpeggio quantize"
            {tipAction}
            onchoose={(id) => send({ type: 'quantize', quantize: id as HarmArpQuantize })}
          />
        </SettingsRow>
        <SettingsRow label="Velocity" labelWidth={LABEL_WIDTH}>
          <ChosenTabs
            tabs={VELOCITY}
            chosen={data.arp.velocity}
            size="compact"
            label="Arpeggio velocity"
            {tipAction}
            onchoose={(id) => send({ type: 'velocity', mode: id as HarmArpVelocity, velocity: data.arp.fixedVelocity })}
          />
          <span class="gap"></span>
          <LineSlider
            value={data.arp.fixedVelocity}
            min={1}
            max={127}
            width={160}
            name="Fixed velocity"
            disabled={data.arp.velocity !== 'fixed'}
            tip="harmony.arp_fixed_velocity"
            {tipAction}
            onchange={(velocity) => send({ type: 'velocity', mode: 'fixed', velocity })}
          />
        </SettingsRow>
      </div>
    {/if}
  </section>

  <section class="settings" aria-labelledby="{uid}-settings" style={sectionHue('r1')}>
    <GroupHeader title={SETTINGS_TITLE[data.kind]} id="{uid}-settings" />
    {#if data.kind === 'multi'}
      <p class="note">Multi Assign has no settings: each right-hand key goes to Right 1, 2 and 3 in turn.</p>
    {:else}
      <SettingsRow label="Assign" labelWidth={LABEL_WIDTH}>
        <ChosenTabs
          tabs={assignTabs}
          chosen={data.assign}
          size="compact"
          label="Assign"
          {tipAction}
          onchoose={(id) => send({ type: 'assign', assign: id as HarmArpAssign })}
        />
      </SettingsRow>
      <SettingsRow label="Volume" hint={data.volumeKnob === null ? '' : `Knob ${data.volumeKnob}`} labelWidth={LABEL_WIDTH}>
        <LineSlider
          value={data.volume}
          min={0}
          max={127}
          width={168}
          name="Volume"
          tip="harmony.volume"
          {tipAction}
          onchange={(volume) => send({ type: 'volume', volume })}
        />
      </SettingsRow>
      {#if data.kind === 'echo'}
        <SettingsRow label="Speed" labelWidth={LABEL_WIDTH}>
          <ChosenTabs
            tabs={SPEEDS.map((s) => ({ id: s, label: s, tip: 'harmony.speed' }))}
            chosen={data.speed}
            size="compact"
            label="Speed"
            {tipAction}
            onchoose={(id) => send({ type: 'speed', speed: id as HarmArpSpeed })}
          />
        </SettingsRow>
      {/if}
      {#if data.kind === 'harmony' || data.kind === 'echo'}
        <SettingsRow label="Touch limit" hint="Keys this hard or harder" labelWidth={LABEL_WIDTH}>
          <LineSlider
            value={data.touchLimit}
            min={1}
            max={127}
            width={168}
            name="Touch limit"
            tip="harmony.touch_limit"
            {tipAction}
            onchange={(velocity) => send({ type: 'touchLimit', velocity })}
          />
        </SettingsRow>
      {/if}
      {#if data.kind === 'harmony'}
        <SettingsRow label="Chord notes" hint="Only chord notes get a harmony" labelWidth={LABEL_WIDTH}>
          <LampButton
            label={onOff(data.chordNoteOnly)}
            on={data.chordNoteOnly}
            size="sm"
            width={64}
            name="Chord note only"
            tip="harmony.chord_note_only"
            {tipAction}
            ontoggle={(on) => send({ type: 'chordNoteOnly', on })}
          />
        </SettingsRow>
      {/if}
      {#if arpKind}
        <SettingsRow label="Hold" hint={data.arp.pedalHold ? 'The pedal holds it too' : 'Plays on after you let go'} labelWidth={LABEL_WIDTH}>
          <LampButton
            label={onOff(data.arp.hold)}
            on={data.arp.hold}
            size="sm"
            width={64}
            name="Arpeggio Hold"
            tip="harmony.arp_hold"
            {tipAction}
            ontoggle={(on) => send({ type: 'hold', on })}
          />
          <LampButton
            label="Pedal"
            on={data.arp.pedalHold}
            size="sm"
            name="Arpeggio Hold pedal"
            tip="harmony.arp_pedal_hold"
            {tipAction}
            ontoggle={(on) => send({ type: 'pedalHold', on })}
          />
        </SettingsRow>
        <SettingsRow label="Keep Key On" hint="The clock runs with no key held" labelWidth={LABEL_WIDTH}>
          <LampButton
            label={onOff(data.arp.keepKeyOn)}
            on={data.arp.keepKeyOn}
            size="sm"
            width={64}
            name="Keep Key On"
            tip="harmony.arp_keep_key_on"
            {tipAction}
            ontoggle={(on) => send({ type: 'keepKeyOn', on })}
          />
        </SettingsRow>
      {/if}
    {/if}
  </section>
</div>

<style>
  .page {
    /* The page's own sizes, which the scale lacks: the Settings column, the grid's five columns. */
    --harm-settings-width: 440px;
    --harm-grid-columns: 5;
    --harm-item-height: 32px;
    --harm-divider-height: 16px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--harm-settings-width);
    column-gap: var(--space-24);
    box-sizing: border-box;
    width: var(--page-width, 1392px);
    height: var(--page-height, 288px);
    overflow: hidden;
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  section {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }

  /* The header: the type's name and caption on the title's baseline, the switch at the end. */
  .name {
    min-width: 0;
    overflow: hidden;
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .name.none {
    color: var(--absent);
  }
  .caption {
    color: var(--caption-ink);
    white-space: nowrap;
  }

  /* The category tabs: Harmony's three, a divider, the word, then the arpeggio categories. */
  .categories {
    display: flex;
    align-items: baseline;
    flex: none;
    box-sizing: border-box;
    height: var(--group-header-height);
    border-bottom: var(--line-width) solid var(--line);
  }
  .divider {
    flex: none;
    align-self: center;
    width: var(--line-width);
    height: var(--harm-divider-height);
    margin: 0 var(--space-12);
    background: var(--line);
  }
  .word {
    margin-right: var(--space-4);
    color: var(--caption-ink);
    white-space: nowrap;
  }

  /* The grid: a hairline list in five columns; the selected type a solid block in the hue. */
  .grid {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(var(--harm-grid-columns), minmax(0, 1fr));
    grid-auto-rows: var(--harm-item-height);
    align-content: start;
    column-gap: var(--space-12);
    min-height: 0;
    margin-top: var(--space-8);
    overflow: hidden;
  }
  .item {
    box-sizing: border-box;
    min-width: 0;
    margin: 0;
    padding: 0 var(--space-8);
    border: 0;
    border-top: var(--line-width) solid var(--line);
    border-radius: var(--radius);
    background: transparent;
    color: var(--tab-rest);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    cursor: pointer;
  }
  .item:hover {
    color: var(--value-ink);
  }
  .item.chosen {
    border-top-color: transparent;
    background: var(--neutral);
    color: var(--on-ink);
  }
  .item:focus-visible {
    outline: var(--line-width) solid var(--focus);
    outline-offset: calc(-1 * var(--focus-offset));
  }

  /* An arpeggio's Quantize and Velocity: at the section's foot, under a hairline. */
  .foot {
    flex: none;
    border-top: var(--line-width) solid var(--line);
  }
  .gap {
    width: var(--space-8);
  }

  .note {
    margin: var(--space-12) 0 0;
    color: var(--caption-ink);
  }
</style>
