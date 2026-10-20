<!--
  PadBankRegion: the Svelte renderer of `PadBankRegion` (PadBank.tsx): a library `Region` whose
  views are the pad banks (`padBankRegionView`, PadBank.model.ts), the PadBank as its body. The
  bank stays the caller's (`bank`, `onBank`, by index).
-->
<script lang="ts">
  import Region from '../../layout/Region.svelte';
  import PadBank from './PadBank.svelte';
  import { padBankRegionView, type PadBankRegionProps } from './PadBank.model';

  interface Props extends Omit<PadBankRegionProps, 'className'> {
    class?: string;
  }

  let { name = 'Pads', area, class: className, ...pads }: Props = $props();
  const region = $derived(padBankRegionView(pads));
</script>

<Region
  {name}
  {area}
  class={className}
  views={region.views}
  view={region.view}
  onView={(id) => pads.onBank?.(Number(id))}
  tipAction={pads.tipAction}
>{#snippet children()}<PadBank {...pads} />{/snippet}</Region>
