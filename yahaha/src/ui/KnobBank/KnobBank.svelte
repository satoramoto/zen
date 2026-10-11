<!--
  KnobBank: the band's Knobs section. A GroupHeader with the knob page tabs right after the title
  (Style, Rack, Pan, Reverb, Chorus, Delay, in the one header tab style), and below it the eight
  Knobs spanning the whole column. Holds no state: the chosen page comes in `page`, a tab choice
  goes out by index, and every knob change is a callback with the knob's position (0–7).
-->
<script lang="ts">
  import type { Action } from 'svelte/action'
  import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
  import type { TabItem } from '../ChosenTabs/types'
  import GroupHeader from '../GroupHeader/GroupHeader.svelte'
  import Knob from '../Knob/Knob.svelte'
  import type { KnobItem } from './types'

  type Props = {
    /** The eight knobs, left to right. */
    knobs: KnobItem[]
    /** The knob page names, one tab each ("Style", "Rack", "Pan", "Reverb", "Chorus", "Delay"). */
    pages?: string[]
    /** The chosen page's index in `pages`. */
    page?: number
    /** The knob page's name ("Style", "Swap R1"): the one tab shown when `pages` is missing or empty. */
    pageLabel?: string
    /** Deprecated, not drawn: the old page counter ("1/6"); the chosen tab says the page. */
    count?: string
    /** The app's `use:tip` action, passed to every control. */
    tipAction?: Action<HTMLElement, string>
    /** A page tab was chosen (its index in `pages`). */
    onpage?: (index: number) => void
    /** Deprecated, not drawn: the old page ▲ button. Use `onpage`. */
    onpageup?: () => void
    /** Deprecated, not drawn: the old page ▼ button. Use `onpage`. */
    onpagedown?: () => void
    /** A knob was clicked. */
    onpress?: (index: number) => void
    /** A knob asked for a step (+1 or −1). */
    onstep?: (index: number, delta: number) => void
  }

  let { knobs, pages = [], page = 0, pageLabel = '', tipAction, onpage, onpress, onstep }: Props = $props()

  let names = $derived(pages.length > 0 ? pages : [pageLabel])
  let tabs: TabItem[] = $derived(names.map((label, i) => ({ id: String(i), label, tip: 'knobs.page' })))
  let chosen = $derived(String(pages.length > 0 ? page : 0))
</script>

<section class="bank" aria-label="Knobs">
  <GroupHeader title="Knobs">
    <ChosenTabs size="header" label="Knob page" {tabs} {chosen} {tipAction} onchoose={(id) => onpage?.(Number(id))} />
  </GroupHeader>
  <div class="knobs">
    {#each knobs as knob, i (i)}
      <Knob
        label={knob.label}
        code={knob.code}
        value={knob.value}
        unit={knob.unit}
        fraction={knob.fraction}
        unused={knob.unused}
        name={`Knob ${i + 1}: ${knob.unused ? 'unused' : `${knob.label} (${knob.code}) ${knob.value}${knob.unit ?? ''}`}`}
        tip="knobs.knob"
        {tipAction}
        onpress={() => onpress?.(i)}
        onstep={(delta) => onstep?.(i, delta)}
      />
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
  .knobs {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    column-gap: var(--knob-gap);
    height: var(--knob-height);
    margin-top: var(--band-body-gap);
  }
</style>
