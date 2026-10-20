<!--
  KnobBankRegion: the Svelte twin of `KnobBankRegion` (KnobBank.tsx): a library `Region` whose views
  are the knob pages (or the one `pageLabel` view, `knobBankRegionView`), and the KnobBank as its
  body. The page stays the caller's (`page`, `onPage`, by index); `form` goes to the bank.
-->
<script lang="ts">
  import Region from '../../layout/Region.svelte';
  import KnobBank from './KnobBank.svelte';
  import { knobBankRegionView, type KnobBankRegionModelProps } from './KnobBank.model';

  interface Props extends KnobBankRegionModelProps {
    class?: string;
  }

  let { name = 'Knobs', area, class: className, ...bank }: Props = $props();
  const region = $derived(knobBankRegionView(bank));
</script>

<Region
  {name}
  {area}
  class={className}
  views={region.views}
  view={region.view}
  onView={(id) => bank.onPage?.(Number(id))}
  tipAction={bank.tipAction}
  >{#snippet children()}<KnobBank {...bank} />{/snippet}</Region
>
