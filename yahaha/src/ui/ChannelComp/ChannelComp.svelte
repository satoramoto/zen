<!--
  ChannelComp: the Channel page's Compressor tab (docs/specs/push/Channel.md, "C · Compressor",
  fitted to the display box's 1110×240 body). Four equal columns: the Compressor group (its On
  lamp in the header, the Type tabs, a note) over columns 1–2, and the Settings group (Threshold,
  Ratio, Attack | Release, Make-up) over columns 3–4. The rows keep their look and still edit while
  the compressor is off (CH-D10). Controlled: every control reports a ChannelChange and the tab
  moves only when `data` does. The page points `--neutral` and the header ink at the part's hue.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import BarReadout from '../BarReadout/BarReadout.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import type { BarKind, ChannelChange, ChannelData, CompParamId, CompPresetId } from '../Channel/types'
  import { STRIP_COMP_PRESETS } from './presets'

  type Props = {
    /** The open part's channel; this tab reads `comp`. */
    data: ChannelData
    /** The app's `use:tip` action, passed in by the wiring; applied to every control with its tooltip key. */
    tipAction?: Action<HTMLElement, string>
    /** Called with each change asked for: `compOn`, `compPreset` (the chosen type too: it puts the type's parameters back), `compParam`. */
    onchange?: (change: ChannelChange) => void
  }

  let { data, tipAction, onchange }: Props = $props()

  const comp = $derived(data.comp)
  const preset = $derived(STRIP_COMP_PRESETS.find((p) => p.id === comp.preset) ?? STRIP_COMP_PRESETS[0])

  const tabs = STRIP_COMP_PRESETS.map((p) => ({ id: p.id, label: p.name, tip: 'mixer.strip.comp_type' }))

  type Row = { param: CompParamId; label: string; min: number; max: number; kind: BarKind }
  const ROWS: Row[] = [
    { param: 'threshold', label: 'Threshold', min: -48, max: 0, kind: 'db' },
    { param: 'ratio', label: 'Ratio', min: 10, max: 200, kind: 'ratio' },
    { param: 'attack', label: 'Attack', min: 1, max: 100, kind: 'ms' },
    { param: 'release', label: 'Release', min: 10, max: 1000, kind: 'ms' },
    { param: 'makeup', label: 'Make-up', min: 0, max: 24, kind: 'db' },
  ]
  const COLUMNS = [ROWS.slice(0, 3), ROWS.slice(3)]

  const uid = $props.id()
</script>

<div class="body">
  <section class="group" aria-labelledby={`${uid}-comp`}>
    <GroupHeader title="Compressor" detail={comp.edited ? 'edited' : undefined} level={3} id={`${uid}-comp`}>
      {#snippet end()}
        <span class="lamp-slot" style:width="72px"
          ><span class="lamp"
            ><LampButton
              label="On"
              on={comp.on}
              size="cell"
              width={72}
              name={comp.on ? 'Compressor on' : 'Compressor off'}
              tip="mixer.strip.comp"
              {tipAction}
              ontoggle={() => onchange?.({ type: 'compOn' })}
            /></span
          ></span
        >
      {/snippet}
    </GroupHeader>
    <div class="rows">
      <div class="row">
        <span class="label">Type</span>
        <ChosenTabs
          {tabs}
          chosen={comp.preset}
          size="compact"
          label="Compressor type"
          {tipAction}
          onchoose={(id) => onchange?.({ type: 'compPreset', preset: id as CompPresetId })}
        />
      </div>
      <p class="note">Presets start at 0 dB make-up; add your own. No gain-reduction meter.</p>
    </div>
  </section>

  <section class="group" aria-labelledby={`${uid}-settings`}>
    <GroupHeader title="Settings" detail="double-click for the type's" level={3} id={`${uid}-settings`} />
    <div class="cols">
      {#each COLUMNS as column, c (c)}
        <div class="col">
          {#each column as row (row.param)}
            <BarReadout
              label={row.label}
              value={comp[row.param]}
              min={row.min}
              max={row.max}
              kind={row.kind}
              default={preset[row.param]}
              tip={`mixer.strip.comp_${row.param}`}
              {tipAction}
              onchange={(value) => onchange?.({ type: 'compParam', param: row.param, value })}
            />
          {/each}
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .body {
    --body-col-gap: 18px; /* the body's column gap: four 264px columns in 1110 */
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    column-gap: var(--body-col-gap);
    align-items: start;
    box-sizing: border-box;
    width: 100%;
    max-height: 240px;
    overflow: hidden;
  }
  .group {
    grid-column: span 2;
    min-width: 0;
  }
  .rows,
  .cols {
    margin-top: var(--header-gap);
  }
  .cols {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--body-col-gap);
  }
  .col {
    min-width: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    height: var(--row-height, var(--control-height));
  }
  .label {
    flex: none;
    align-self: center;
    width: 76px;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  /* ChosenTabs is drawn for a 36px header row, its block standing on the rule. In a plain row the
     tab is just its block, centred in the row, the label where it sits in a header's block. */
  .row :global([role='tablist']) {
    align-self: center;
  }
  .row :global([role='tablist'] > [role='tab']) {
    height: var(--tab-block);
  }
  .row :global([role='tablist'] > [role='tab']::before) {
    height: calc(var(--header-baseline) - var(--tab-height-header) + var(--tab-block));
  }
  .note {
    margin: var(--space-12) 0 0;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  /* The On lamp in the header: an empty box on the row's baseline holds its width, and the lamp
     hangs from it so it is centred between the row's top and its rule (a 32px lamp would else
     sit on the text baseline and cross the rule). */
  .lamp-slot {
    position: relative;
    display: inline-block;
    height: 0;
  }
  .lamp {
    position: absolute;
    right: 0;
    bottom: calc(
      var(--header-baseline) + var(--header-rule-width) +
        (var(--group-header-height) - var(--header-rule-width) - var(--control-height)) / 2 - var(--group-header-height)
    );
    display: flex;
    height: var(--control-height);
  }
</style>
