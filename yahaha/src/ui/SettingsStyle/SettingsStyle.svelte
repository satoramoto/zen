<!--
  SettingsStyle: the Style page of the Settings screen, below the Screen's page header. Three
  columns, each a level-3 group header over its rows: Sections (when sections change, Stop Accomp,
  what a new style keeps, Section set and reset), Timing & feel (Sync Stop window, the fades,
  Retrigger, Swing, Section tempo) and Playing (the playing switches, then the Dynamics group, whose
  Accent row's More reveals Accent mode and source). Every one-of-many choice is a compact
  ChosenTabs, every switch a 64-wide On/Off lamp, every amount a LineSlider. Controlled: it draws
  `data` and reports each change as `{ key, value }`; only More's open state is its own.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import type { TabItem } from '../ChosenTabs/types'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import LineSlider from '../LineSlider/LineSlider.svelte'
  import SettingsRow from '../SettingsRow/SettingsRow.svelte'
  import { SECTION_HUES, sectionHue } from '../Settings/hues'
  import type { StyleChange, StylePageData } from '../Settings/types'

  /**
   * One label column for the whole page, so every column's controls start the same distance in:
   * the smallest that fits the longest label ("Sync Stop window", 111 px in 13 px DM Sans).
   */
  const LABEL_WIDTH = 112

  const HUES = SECTION_HUES.style

  type Props = {
    /** Every Style setting, as the engine has it. */
    data: StylePageData
    /** The app's `use:tip` action, passed to every control. */
    tipAction?: Action<HTMLElement, string>
    /** Called with the setting asked for: its key and new value. The page itself changes nothing. */
    onchange?: (change: StyleChange) => void
  }

  let { data, tipAction, onchange }: Props = $props()

  const uid = $props.id()

  /** Accent mode and source are shown (the Accent row's More is open). */
  let more = $state(false)

  function set<K extends keyof StylePageData>(key: K, value: StylePageData[K]) {
    onchange?.({ key, value } as StyleChange)
  }

  /** Tabs whose ids are the values themselves, each with the row's tooltip. */
  const tabs = (tip: string, items: [string, string][]): TabItem[] =>
    items.map(([id, label]) => ({ id, label, tip }))

  const MAIN_TIMING = tabs('settings.section_timing', [
    ['immediate', 'Immediate'],
    ['nextBar', 'Next bar'],
  ])
  const INTRO_ENDING = tabs('settings.intro_ending_timing', [
    ['nextBar', 'Next bar'],
    ['endOfSection', 'End of section'],
  ])
  const OTS_LINK = tabs('settings.ots_link_timing', [
    ['immediate', 'Immediate'],
    ['mainChange', 'At Main change'],
  ])
  const STOP_ACMP: TabItem[] = [
    { id: 'off', label: 'Off', tip: 'settings.stop_acmp_off' },
    { id: 'style', label: 'Style', tip: 'settings.stop_acmp_style' },
    { id: 'fixed', label: 'Fixed', tip: 'settings.stop_acmp_fixed' },
  ]
  const KEEP: [string, string][] = [
    ['lock', 'Lock'],
    ['hold', 'Hold'],
    ['reset', 'Reset'],
  ]
  const TEMPO_CHANGE = tabs('settings.tempo_change', KEEP)
  const PARTS_CHANGE = tabs('settings.parts_change', KEEP)
  const SECTION_SET: TabItem[] = [
    { id: 'off', label: 'Off', tip: 'settings.section_set' },
    ...['A', 'B', 'C', 'D'].map((letter, i) => ({
      id: String(i),
      label: letter,
      name: `Main ${letter}`,
      tip: 'settings.section_set',
    })),
  ]
  const RETRIGGER_RATE: TabItem[] = [1, 2, 4, 8, 16, 32].map((rate) => ({
    id: String(rate),
    label: rate === 1 ? '1' : `1/${rate}`,
    tip: 'settings.retrigger_rate',
  }))
  const SWING_GRID = tabs('style.swing_grid', [
    ['8', '1/8'],
    ['16', '1/16'],
  ])
  const UNISON_TYPE = tabs('settings.unison_type', [
    ['root', 'Root'],
    ['melody', 'Melody'],
  ])
  const ACCENT_MODE: TabItem[] = [
    { id: 'hits', label: 'Hits', tip: 'dynamics.accent_mode_hits' },
    { id: 'fill', label: 'Fill', tip: 'dynamics.accent_mode_fill' },
  ]
  const ACCENT_SOURCE: TabItem[] = [
    { id: 'left', label: 'Left hand', tip: 'dynamics.accent_source_left' },
    { id: 'both', label: 'Both hands', tip: 'dynamics.accent_source_both' },
  ]

  /** A time in ms shown in seconds with one decimal ("5.0"). */
  const seconds = (ms: number) => (ms / 1000).toFixed(1)
</script>

{#snippet lamp(key: keyof StylePageData, on: boolean, name: string, tip: string, disabled = false)}
  <LampButton
    label={on ? 'On' : 'Off'}
    {on}
    {name}
    {tip}
    {tipAction}
    {disabled}
    size="sm"
    width={64}
    ontoggle={(next) => set(key, next as never)}
  />
{/snippet}

<div class="page">
  <section class="column" aria-labelledby="{uid}-sections" style={sectionHue(HUES.sections)}>
    <GroupHeader title="Sections" level={3} id="{uid}-sections" />
    <SettingsRow labelWidth={LABEL_WIDTH} label="Main timing">
      <ChosenTabs
        tabs={MAIN_TIMING}
        chosen={data.mainTiming}
        size="compact"
        label="Main timing"
        {tipAction}
        onchoose={(id) => set('mainTiming', id as StylePageData['mainTiming'])}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Intro & ending">
      <ChosenTabs
        tabs={INTRO_ENDING}
        chosen={data.introEndingTiming}
        size="compact"
        label="Intro and ending timing"
        {tipAction}
        onchoose={(id) => set('introEndingTiming', id as StylePageData['introEndingTiming'])}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="OTS Link timing">
      <ChosenTabs
        tabs={OTS_LINK}
        chosen={data.otsLinkTiming}
        size="compact"
        label="One Touch Setting Link timing"
        {tipAction}
        onchoose={(id) => set('otsLinkTiming', id as StylePageData['otsLinkTiming'])}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Stop Accomp">
      <ChosenTabs
        tabs={STOP_ACMP}
        chosen={data.stopAcmp}
        size="compact"
        label="Stop Accompaniment"
        {tipAction}
        onchoose={(id) => set('stopAcmp', id as StylePageData['stopAcmp'])}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="New style: tempo">
      <ChosenTabs
        tabs={TEMPO_CHANGE}
        chosen={data.tempoChange}
        size="compact"
        label="On a new style, tempo"
        {tipAction}
        onchoose={(id) => set('tempoChange', id as StylePageData['tempoChange'])}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="New style: parts">
      <ChosenTabs
        tabs={PARTS_CHANGE}
        chosen={data.partsChange}
        size="compact"
        label="On a new style, parts on and off"
        {tipAction}
        onchoose={(id) => set('partsChange', id as StylePageData['partsChange'])}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Section set">
      <ChosenTabs
        tabs={SECTION_SET}
        chosen={data.sectionSet === null ? 'off' : String(data.sectionSet)}
        size="compact"
        label="Section set: the Main a new style starts on"
        {tipAction}
        onchoose={(id) => set('sectionSet', id === 'off' ? null : Number(id))}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Section reset" hint="Shift + Play">
      {@render lamp('sectionReset', data.sectionReset, 'Section reset', 'settings.section_reset')}
    </SettingsRow>
  </section>

  <section class="column" aria-labelledby="{uid}-timing" style={sectionHue(HUES.timing)}>
    <GroupHeader title="Timing & feel" level={3} id="{uid}-timing" />
    <SettingsRow labelWidth={LABEL_WIDTH} label="Sync Stop window">
      <LineSlider
        value={data.syncStopWindowMs}
        min={0}
        max={5000}
        step={100}
        name="Synchro Stop window"
        valueText={data.syncStopWindowMs === 0 ? 'Off' : undefined}
        unit={data.syncStopWindowMs === 0 ? '' : 'ms'}
        tip="settings.synchro_stop_window"
        {tipAction}
        onchange={(value) => set('syncStopWindowMs', value)}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Fade in">
      <LineSlider
        value={data.fadeInMs}
        min={0}
        max={20000}
        step={100}
        name="Fade in time"
        valueText={seconds(data.fadeInMs)}
        unit="s"
        tip="settings.fade_in"
        {tipAction}
        onchange={(value) => set('fadeInMs', value)}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Fade out">
      <LineSlider
        value={data.fadeOutMs}
        min={0}
        max={20000}
        step={100}
        name="Fade out time"
        valueText={seconds(data.fadeOutMs)}
        unit="s"
        tip="settings.fade_out"
        {tipAction}
        onchange={(value) => set('fadeOutMs', value)}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Fade hold">
      <LineSlider
        value={data.fadeHoldMs}
        min={0}
        max={5000}
        step={100}
        name="Fade hold: silence after a fade out"
        valueText={seconds(data.fadeHoldMs)}
        unit="s"
        tip="settings.fade_hold"
        {tipAction}
        onchange={(value) => set('fadeHoldMs', value)}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Retrigger" hint="Knob 3">
      {@render lamp('retrigger', data.retrigger, 'Retrigger', 'transport.retrigger')}
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Retrig rate">
      <ChosenTabs
        tabs={RETRIGGER_RATE}
        chosen={String(data.retriggerRate)}
        size="compact"
        label="Retrigger rate"
        {tipAction}
        onchoose={(id) => set('retriggerRate', Number(id))}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Swing">
      <LineSlider
        value={data.swing}
        min={0}
        max={100}
        name="Swing"
        unit="%"
        tip="style.swing"
        {tipAction}
        onchange={(value) => set('swing', value)}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Swing grid">
      <ChosenTabs
        tabs={SWING_GRID}
        chosen={String(data.swingGrid)}
        size="compact"
        label="Swing grid"
        {tipAction}
        onchoose={(id) => set('swingGrid', Number(id))}
      />
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Section tempo">
      {@render lamp('sectionTempo', data.sectionTempo, 'Section tempo', 'settings.section_tempo')}
    </SettingsRow>
  </section>

  <section class="column" aria-labelledby="{uid}-playing" style={sectionHue(HUES.playing)}>
    <GroupHeader title="Playing" level={3} id="{uid}-playing" />
    <SettingsRow labelWidth={LABEL_WIDTH} label="Auto Fill">
      {@render lamp('autoFill', data.autoFill, 'Auto Fill', 'transport.auto_fill')}
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Sync Stop">
      {@render lamp('syncStop', data.syncStop, 'Sync Stop', 'transport.sync_stop', !data.syncStopAvailable)}
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Half-bar fill">
      {@render lamp('halfBarFill', data.halfBarFill, 'Half-bar fill', 'transport.half_bar_fill')}
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Unison">
      {@render lamp('unison', data.unison, 'Unison', 'transport.unison')}
    </SettingsRow>
    <SettingsRow labelWidth={LABEL_WIDTH} label="Unison bass">
      <ChosenTabs
        tabs={UNISON_TYPE}
        chosen={data.unisonType}
        size="compact"
        label="Unison bass"
        {tipAction}
        onchoose={(id) => set('unisonType', id as StylePageData['unisonType'])}
      />
    </SettingsRow>

    <div class="sub" role="group" aria-labelledby="{uid}-dynamics" style={sectionHue(HUES.dynamics)}>
      <GroupHeader title="Dynamics" level={4} id="{uid}-dynamics" />
      <SettingsRow labelWidth={LABEL_WIDTH} label="Control">
        {@render lamp('dynamicsControl', data.dynamicsControl, 'Dynamics control', 'dynamics.control')}
      </SettingsRow>
      <SettingsRow labelWidth={LABEL_WIDTH} label="Level">
        <LineSlider
          value={data.dynamicsLevel}
          min={0}
          max={127}
          name="Dynamics level"
          disabled={!data.dynamicsControl}
          tip="dynamics.level"
          {tipAction}
          onchange={(value) => set('dynamicsLevel', value)}
        />
      </SettingsRow>
      <SettingsRow labelWidth={LABEL_WIDTH} label="Touch">
        {@render lamp('touch', data.touch, 'Dynamics touch', 'dynamics.touch')}
      </SettingsRow>
      <SettingsRow labelWidth={LABEL_WIDTH} label="Accent">
        {@render lamp('accent', data.accent, 'Dynamics accent', 'dynamics.accent')}
        <Button
          label="More"
          name="More accent settings"
          on={more}
          pressed={more}
          tip="dynamics.accent_more"
          {tipAction}
          onpress={() => (more = !more)}
        />
      </SettingsRow>
      {#if more}
        <SettingsRow labelWidth={LABEL_WIDTH} label="Accent mode">
          <ChosenTabs
            tabs={ACCENT_MODE}
            chosen={data.accentMode}
            size="compact"
            label="Accent mode"
            {tipAction}
            onchoose={(id) => set('accentMode', id as StylePageData['accentMode'])}
          />
        </SettingsRow>
        <SettingsRow labelWidth={LABEL_WIDTH} label="Accent source">
          <ChosenTabs
            tabs={ACCENT_SOURCE}
            chosen={data.accentSource}
            size="compact"
            label="Accent source"
            {tipAction}
            onchoose={(id) => set('accentSource', id as StylePageData['accentSource'])}
          />
        </SettingsRow>
      {/if}
      <SettingsRow labelWidth={LABEL_WIDTH} label="Threshold">
        <LineSlider
          value={data.accentThreshold}
          min={1}
          max={127}
          name="Accent threshold"
          tip="dynamics.accent_threshold"
          {tipAction}
          onchange={(value) => set('accentThreshold', value)}
        />
      </SettingsRow>
    </div>
  </section>
</div>

<style>
  .page {
    /* The page area the Settings screen gives a page, below its header. */
    --settings-page-width: 1048px;
    --settings-page-height: 560px;
    /* The widest slider readout ("5000 ms") in 13 px type. */
    --settings-readout-width: 56px;
    --settings-group-gap: var(--space-12);
    display: grid;
    /* The middle column (Retrig rate's six tabs) takes its natural width; the outer two share the rest. */
    grid-template-columns: minmax(0, 1fr) minmax(max-content, 1fr) minmax(0, 1fr);
    align-content: start;
    column-gap: var(--space-24);
    box-sizing: border-box;
    width: var(--settings-page-width);
    max-width: 100%;
    height: var(--settings-page-height);
    max-height: 100%;
    overflow: auto;
    background: var(--g);
    color: var(--value-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .column {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  /* A group under another group in the same column: the same gap above its header every time. */
  .sub {
    display: flex;
    flex-direction: column;
    margin-top: var(--settings-group-gap);
  }
  /* Every slider's value and unit in one fixed, right-aligned box, so the numbers line up down a
     column ("5000 ms", "20.0 s", "100 %"). */
  .page :global(.slider .readout) {
    justify-content: flex-end;
    min-width: var(--settings-readout-width);
  }
</style>
