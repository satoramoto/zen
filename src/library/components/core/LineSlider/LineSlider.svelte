<!--
  LineSlider: the model's tree (`lineSliderView`, LineSlider.model.ts) drawn by the Svelte `Tree`, as
  `LineSlider.tsx` draws it with the React one; see LineSlider.tsx for the job and the tuning knobs.
  The keys and the drag are the `lineSlider` store the tree binds (`slide.ts`).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { lineSliderHandlers, lineSliderView, type LineSliderModelProps } from './LineSlider.model';
  import '../../../primitives/Text.css';
  import './LineSlider.css';

  let props: LineSliderModelProps = $props();
</script>

<Tree tree={lineSliderView(props)} handlers={lineSliderHandlers(props)} />
