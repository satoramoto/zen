<!--
  PadBank: the band's Pads section. A GroupHeader with the pad bank tabs right after the title
  (Sections, Quick Racks, Chord, Multi Pads, Setup, in the one header tab style) and the bank's hue
  legend at the row's right end; `--band-body-gap` below the header's rule, sixteen Pads in two
  rows of eight across the whole column (or, with `columns` 4, a 4 × 4 grid), each outlined in its own hue. Holds no state: the chosen
  bank comes in `bank` and the flash phase in `lit`; a tab choice and a press go out by index.
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import type { TabItem } from '../ChosenTabs/types'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import HueLegend from '../HueLegend/HueLegend.svelte'
  import Pad from '../Pad/Pad.svelte'
  import type { LegendItem, PadItem } from './types'

  /** The bank tabs' tooltip keys by index, when `bankTips` doesn't give one. */
  const BANK_TIPS = ['padpage.sections', 'padpage.racks', 'padpage.chord', 'padpage.multi_pads', 'padpage.setup']

  type Props = {
    /** The sixteen pads, row by row. */
    pads: PadItem[]
    /** How many pads a row: 8 (two rows of eight, the Launchkey's layout) or 4 (a 4 × 4 grid, pads 1–4, 5–8, 9–12, 13–16). */
    columns?: 4 | 8
    /** The pad bank names, one tab each ("Sections", "Quick Racks", "Chord", "Multi Pads", "Setup"). */
    banks?: string[]
    /** The chosen bank's index in `banks`. */
    bank?: number
    /** Each bank tab's tooltip key, by index. Default: padpage.sections, padpage.racks, padpage.chord, padpage.multi_pads, padpage.setup. */
    bankTips?: string[]
    /** The bank's name ("Sections"): the one tab shown when `banks` is missing or empty. */
    bankName?: string
    /** Deprecated, not drawn: the old bank counter ("1/5"); the chosen tab says the bank. */
    count?: string
    /** The hue legend at the header's right end. */
    legend?: LegendItem[]
    /** The flash phase of queued and armed pads. */
    lit?: boolean
    /** The app's `use:tip` action, passed to every control. */
    tipAction?: Action<HTMLElement, string>
    /** A bank tab was chosen (its index in `banks`). */
    onbank?: (index: number) => void
    /** Deprecated, not drawn: the old bank ▲ button. Use `onbank`. */
    onbankup?: () => void
    /** Deprecated, not drawn: the old bank ▼ button. Use `onbank`. */
    onbankdown?: () => void
    /** A pad was pressed (0–15). */
    onpress?: (index: number) => void
  }

  let {
    pads,
    columns = 8,
    banks = [],
    bank = 0,
    bankTips = BANK_TIPS,
    bankName = '',
    legend = [],
    lit = true,
    tipAction,
    onbank,
    onpress,
  }: Props = $props()

  let names = $derived(banks.length > 0 ? banks : [bankName])
  let tabs: TabItem[] = $derived(
    names.map((label, i) => ({ id: String(i), label, tip: bankTips[i] ?? BANK_TIPS[i] })),
  )
  let chosen = $derived(String(banks.length > 0 ? bank : 0))
</script>

<section class="bank" aria-label="Pads">
  <GroupHeader title="Pads">
    <ChosenTabs size="header" label="Pad bank" {tabs} {chosen} {tipAction} onchoose={(id) => onbank?.(Number(id))} />
    {#snippet end()}
      {#if legend.length > 0}<HueLegend items={legend} />{/if}
    {/snippet}
  </GroupHeader>
  <div class="pads" style:--pad-columns={columns}>
    {#each pads as pad, i (i)}
      <div class="cell">
        <Pad
          label={pad.label}
          index={String(i + 1)}
          family={pad.family}
          state={pad.state}
          {lit}
          name={pad.name}
          tip={pad.tip}
          {tipAction}
          onpress={() => onpress?.(i)}
        />
      </div>
    {/each}
  </div>
</section>

<style>
  .bank {
    display: flex;
    flex-direction: column;
    width: var(--band-middle-width);
    font-family: var(--font-sans);
  }
  .pads {
    display: grid;
    grid-template-columns: repeat(var(--pad-columns), minmax(0, 1fr));
    grid-auto-rows: var(--pad-height, var(--pad-size));
    gap: var(--pad-gap);
    margin-top: var(--band-body-gap);
  }
  .cell {
    min-width: 0;
  }
</style>
