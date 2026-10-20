<!--
  Segmented: the model's tree (`segmentedView`, Segmented.model.ts) drawn by the Svelte `Tree`, as
  `Segmented.tsx` draws it with the React one; see Segmented.tsx for the job and the parts. The
  arrows, the clicks and focus following the choice are the `segmented` store the tree binds
  (`segmentedInput.ts`).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { segmentedHandlers, segmentedView, type SegmentedModelProps } from './Segmented.model';
  import '../../../primitives/Text.css';
  import './Segmented.css';

  let props: SegmentedModelProps = $props();
</script>

<Tree tree={segmentedView(props)} handlers={segmentedHandlers(props)} />
