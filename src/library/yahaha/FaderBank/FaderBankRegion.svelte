<!--
  FaderBankRegion: the Svelte twin of `FaderBankRegion` (FaderBank.tsx), the same Region, views,
  aside and body. The fader pages are the Region's `views`, the layer `Tabs` its `aside`, and the
  FaderBank for the chosen page its body; the page and layer stay the caller's.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Region from '../../layout/Region.svelte';
  import Tabs from '../../layout/Tabs.svelte';
  import FaderBank from './FaderBank.svelte';
  import type { FaderBankRegionModelProps } from './FaderBank.model';

  interface Props extends FaderBankRegionModelProps<string | Snippet> {
    class?: string;
  }

  let { name = 'Mixer', area, class: className, ...bank }: Props = $props();
</script>

{#snippet layers()}<Tabs
    name="Fader layer"
    items={bank.layerTabs}
    value={bank.layer}
    onChange={(id: string) => bank.onChooseLayer?.(id)}
    tipAction={bank.tipAction}
  />{/snippet}

<Region
  {name}
  {area}
  class={className}
  aside={bank.layerTabs.length > 0 ? layers : undefined}
  views={bank.pageTabs}
  view={bank.page}
  onView={(id: string) => bank.onChoosePage?.(id)}
  tipAction={bank.tipAction}
  >{#snippet children()}<FaderBank {...bank} />{/snippet}</Region
>
