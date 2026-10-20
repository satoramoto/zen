<!--
  FaderBankRegion: the model's tree (`faderBankRegionView`, FaderBank.model.ts) drawn by the Svelte
  `Tree`: the mixer's Region whose views are the fader pages, the layer `Tabs` in its `aside`, and
  the FaderBank for the chosen page as its body; the page and layer stay the caller's. See
  `FaderBankRegion` in FaderBank.tsx.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { faderBankRegionHandlers, faderBankRegionView, type FaderBankRegionModelProps } from './FaderBank.model';

  interface Props extends FaderBankRegionModelProps<string | Snippet> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
</script>

<Tree tree={faderBankRegionView({ ...props, className })} handlers={faderBankRegionHandlers(props)} />
