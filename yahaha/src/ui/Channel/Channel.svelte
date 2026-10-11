<!--
  Channel: the Channel page, one part's channel, in the Stage's display box (`--page-width` ×
  `--page-height`, 1392 × 288; docs/specs/push/Channel.md fitted to the box). On the left the
  parts list (twelve parts, the open one the solid block in its hue). On the right a header row:
  the open part's name as the heading, the group tabs (Mix, EQ & Tone, Compressor, Inserts), the
  part's CPU and ◀ ▶ to the parts either side; under it the chosen tab's group, 240 tall. The
  whole right side takes the open part's hue (`sectionHue`): the header, the bars, lamps and tabs;
  a Style part draws in the neutral ink. Every change goes out through `onchange` (the wiring turns
  it into its command), a part through `onpart`, a tab through `ontab`.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import Button from '../Button/Button.svelte'
  import ChannelComp from '../ChannelComp/ChannelComp.svelte'
  import ChannelEqTone from '../ChannelEqTone/ChannelEqTone.svelte'
  import ChannelInserts from '../ChannelInserts/ChannelInserts.svelte'
  import ChannelMix from '../ChannelMix/ChannelMix.svelte'
  import ChannelParts from '../ChannelParts/ChannelParts.svelte'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import type { TabItem } from '../ChosenTabs/types'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import { sectionHue } from '../Settings/hues'
  import { cpuPercent } from './cpu'
  import type { ChannelChange, ChannelData, ChannelTab } from './types'

  type Props = {
    /** Everything the page shows: the parts, the open part's channel, the chosen tab. */
    data: ChannelData
    /** The app's tooltip action (`use:tip`), passed to every control. */
    tipAction?: Action<HTMLElement, string>
    /** A change to the open part's channel (the wiring sends its command). */
    onchange?: (change: ChannelChange) => void
    /** Open part 0–11 (the parts list, ◀ ▶). */
    onpart?: (part: number) => void
    /** A group tab was chosen. */
    ontab?: (tab: ChannelTab) => void
    /** The sound was clicked: choose another (Library › Sounds). */
    onsound?: () => void
    /** Edit pressed: open the plugin's editor window. */
    onedit?: () => void
  }

  let { data, tipAction, onchange, onpart, ontab, onsound, onedit }: Props = $props()

  const TABS: TabItem[] = [
    { id: 'mix', label: 'Mix', name: 'Mix: sound, level and sends', tip: 'mixer.channel.tab' },
    { id: 'eqTone', label: 'EQ & Tone', name: 'EQ, tone and play', tip: 'mixer.channel.tab' },
    { id: 'comp', label: 'Compressor', tip: 'mixer.channel.tab' },
    { id: 'inserts', label: 'Inserts', tip: 'mixer.channel.tab' },
  ]

  const hueStyle = $derived(data.hue ? sectionHue(data.hue) : undefined)
  const cpu = $derived(data.cpu === null ? null : cpuPercent(data.cpu))

  /** The tooltip on the CPU readout, when the wiring passes the app's action. */
  function tipOn(node: HTMLElement, key: string) {
    if (!tipAction) return
    return tipAction(node, key)
  }
</script>

<section class="channel" aria-label="Channel: {data.partName}">
  <div class="parts">
    <ChannelParts parts={data.parts} open={data.part} {tipAction} onopen={onpart} />
  </div>
  <div class="main" style={hueStyle}>
    <div class="head">
      <div class="header">
        <GroupHeader title={data.partName} level={2}>
          <ChosenTabs
            tabs={TABS}
            chosen={data.tab}
            size="header"
            label="Channel groups"
            {tipAction}
            onchoose={(id) => ontab?.(id as ChannelTab)}
          />
          {#snippet end()}
            <span class="cpu" data-tip="mixer.cpu" use:tipOn={'mixer.cpu'}
              ><span class="caption">CPU</span> {#if cpu === null}<span class="none" data-hue="d">—</span
                >{:else}<span class="value">{cpu}</span><span class="caption">%</span>{/if}</span
            >
          {/snippet}
        </GroupHeader>
      </div>
      <div class="step">
        <Button
          symbol="prev"
          size="icon"
          name="Previous part ({data.prevTag})"
          tip="mixer.channel.prev"
          {tipAction}
          onpress={() => onpart?.((data.part + 11) % 12)}
        />
        <Button
          symbol="next"
          size="icon"
          name="Next part ({data.nextTag})"
          tip="mixer.channel.next"
          {tipAction}
          onpress={() => onpart?.((data.part + 1) % 12)}
        />
      </div>
    </div>
    <div class="body" data-tab={data.tab}>
      {#if data.tab === 'mix'}
        <ChannelMix {data} {tipAction} {onchange} {onsound} {onedit} />
      {:else if data.tab === 'eqTone'}
        <ChannelEqTone {data} {tipAction} {onchange} />
      {:else if data.tab === 'comp'}
        <ChannelComp {data} {tipAction} {onchange} />
      {:else}
        <ChannelInserts {data} {tipAction} {onchange} />
      {/if}
    </div>
  </div>
</section>

<style>
  .channel {
    --channel-gutter: calc(var(--space-16) + var(--space-2));
    --channel-parts-width: 264px;
    /* Rows of 40 (32px controls centred in them): the parts list's six rows then fill the box
       (36 header + 12 + 6 × 40 = 288), and the groups' rows line up with them. */
    --row-height: calc(var(--control-height) + var(--space-8));
    display: flex;
    gap: var(--channel-gutter);
    box-sizing: border-box;
    width: var(--page-width, 1392px);
    height: var(--page-height, 288px);
    overflow: hidden;
    color: var(--value-ink);
    font: var(--type-text);
    letter-spacing: var(--tracking-text);
  }
  .parts {
    flex: none;
    width: var(--channel-parts-width);
    min-width: 0;
  }
  .main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--header-gap);
  }
  .head {
    display: flex;
    align-items: flex-start;
    gap: var(--space-12);
  }
  .header {
    flex: 1;
    min-width: 0;
  }
  .step {
    flex: none;
    display: flex;
    gap: var(--space-4);
  }
  .cpu {
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .caption {
    color: var(--caption-ink);
  }
  .value {
    color: var(--value-ink);
    font: var(--type-strong);
    letter-spacing: var(--tracking-strong);
  }
  .none {
    color: var(--absent);
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
