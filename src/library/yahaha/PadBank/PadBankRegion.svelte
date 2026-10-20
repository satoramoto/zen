<!--
  PadBankRegion: the model's tree (`padBankRegionView`, PadBank.model.ts) drawn by the Svelte
  `Tree`, as `PadBankRegion` (PadBank.tsx) draws it with the React one: a library `Region` whose
  views are the pad banks, the PadBank as its body. The bank stays the caller's (`bank`, `onBank`,
  by index).
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { padBankRegionHandlers, padBankRegionView, type PadBankRegionProps } from './PadBank.model';

  interface Props extends Omit<PadBankRegionProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
</script>

<Tree tree={padBankRegionView({ ...props, className })} handlers={padBankRegionHandlers(props)} />
