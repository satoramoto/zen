<!--
  ChannelInserts: the Channel page's Inserts tab (docs/specs/push/Channel.md, "D · Inserts and
  Play", the insert slots, fitted to the display box's 1110×240 body). Four equal columns: insert 1
  over columns 1–2 and insert 2 over columns 3–4, each a header (its On lamp at the right end while
  the slot has a kind), the kind tabs and up to four settings in two columns (1, 2 | 3, 4); under
  them, on the left, the global Rotary fast lamp. A Style part's slot 1 is the style's insert
  (CH-D23), live like any other. Controlled: every control reports a ChannelChange and the tab moves
  only when `data` does. The page points `--neutral` and the header ink at the part's hue.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import BarReadout from '../BarReadout/BarReadout.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import LampButton from '../LampButton/LampButton.svelte'
  import type { ChannelChange, ChannelData, ChannelInsert } from '../Channel/types'

  type Props = {
    /** The open part's channel; this tab reads `inserts`, `insertKinds`, `keyboard` and `rotaryFast`. */
    data: ChannelData
    /** The app's `use:tip` action, passed in by the wiring; applied to every control with its tooltip key. */
    tipAction?: Action<HTMLElement, string>
    /** Called with each change asked for: `insertKind` (only for a kind other than the slot's), `insertOn`, `insertSetting`, `rotaryFast`. */
    onchange?: (change: ChannelChange) => void
  }

  let { data, tipAction, onchange }: Props = $props()

  const uid = $props.id()

  /** The slot's kind tabs: the build's kinds, then the slot's own kind by its name when the list lacks it. */
  function kindTabs(slot: ChannelInsert) {
    const tabs = data.insertKinds.map((k) => ({ id: k.kind, label: k.name, tip: 'mixer.strip.insert_kind' }))
    if (!tabs.some((t) => t.id === slot.kind)) tabs.push({ id: slot.kind, label: slot.name, tip: 'mixer.strip.insert_kind' })
    return tabs
  }

  function chooseKind(index: number, kind: string) {
    if (kind === data.inserts[index]?.kind) return
    onchange?.({ type: 'insertKind', slot: index, kind })
  }
</script>

<div class="body">
  {#each data.inserts.slice(0, 2) as slot, i (i)}
    {@const n = i + 1}
    <section class="slot" aria-labelledby={`${uid}-insert-${n}`}>
      <GroupHeader
        title={`Insert ${n}`}
        detail={i === 0 && !data.keyboard ? "the style's" : undefined}
        level={3}
        id={`${uid}-insert-${n}`}
      >
        {#snippet end()}
          {#if slot.kind !== 'none'}
            <span class="lamp-slot" style:width="52px"
              ><span class="lamp"
                ><LampButton
                  label="On"
                  on={slot.on}
                  size="cell"
                  width={52}
                  name={slot.on ? `Insert ${n} on` : `Insert ${n} off`}
                  tip="mixer.strip.insert_on"
                  {tipAction}
                  ontoggle={() => onchange?.({ type: 'insertOn', slot: i })}
                /></span
              ></span
            >
          {/if}
        {/snippet}
      </GroupHeader>
      <div class="kind">
        <ChosenTabs
          tabs={kindTabs(slot)}
          chosen={slot.kind}
          size="compact"
          label={`Insert ${n} kind`}
          {tipAction}
          onchoose={(kind) => chooseKind(i, kind)}
        />
      </div>
      {#if slot.kind === 'none'}
        <p class="caption">Empty: choose a kind above.</p>
      {:else if slot.settings.length > 0}
        <div class="cols">
          {#each [slot.settings.slice(0, 2), slot.settings.slice(2, 4)] as column, c (c)}
            <div class="col">
              {#each column as setting, k (k)}
                {@const j = c * 2 + k}
                <BarReadout
                  label={setting.name}
                  value={setting.value}
                  min={setting.min}
                  max={setting.max}
                  kind="display"
                  display={setting.display}
                  default={setting.default}
                  tip={`mixer.strip.insert_setting_${j + 1}`}
                  {tipAction}
                  onchange={(value) => onchange?.({ type: 'insertSetting', slot: i, setting: j, value })}
                />
              {/each}
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/each}

  <div class="rotary">
    <LampButton
      label="Rotary fast"
      on={data.rotaryFast}
      size="cell"
      width={104}
      name="Rotary fast, global: the rotary speed for every part"
      tip="fx.rotary_fast"
      {tipAction}
      ontoggle={() => onchange?.({ type: 'rotaryFast' })}
    />
    <span class="note">global: every part's rotary speed</span>
  </div>
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
  .slot {
    grid-column: span 2;
    min-width: 0;
  }
  .kind {
    display: flex;
    align-items: center;
    height: var(--row-height, var(--control-height));
    margin-top: var(--header-gap);
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }
  /* ChosenTabs is drawn for a 36px header row, its block standing on the rule. In a plain row the
     tab is just its block, centred in the row, the label where it sits in a header's block. */
  .kind :global([role='tab']) {
    height: var(--tab-block);
  }
  .kind :global([role='tab']::before) {
    height: calc(var(--header-baseline) - var(--tab-height-header) + var(--tab-block));
  }
  .cols {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--body-col-gap);
  }
  .col {
    min-width: 0;
  }
  .caption {
    display: flex;
    align-items: center;
    height: var(--row-height, var(--control-height));
    margin: 0;
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .rotary {
    grid-column: 1 / span 2;
    display: flex;
    align-items: center;
    gap: var(--space-12);
    height: var(--row-height, var(--control-height));
    margin-top: var(--space-12);
  }
  .note {
    color: var(--caption-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
    white-space: nowrap;
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
