<!--
  KnobBankRegion: the model's tree (`knobBankRegionView`, KnobBank.model.ts) drawn by the Svelte
  `Tree`, as `KnobBankRegion` (KnobBank.tsx) draws it with the React one: a library `Region` whose
  views are the knob pages (or the one `pageLabel` view), and the KnobBank as its body. The page
  stays the caller's (`page`, `onPage`, by index); `form` goes to the bank.
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { knobBankRegionHandlers, knobBankRegionView, type KnobBankRegionModelProps } from './KnobBank.model';

  interface Props extends KnobBankRegionModelProps {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
</script>

<Tree tree={knobBankRegionView(props, className)} handlers={knobBankRegionHandlers(props)} />
