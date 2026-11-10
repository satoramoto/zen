<!--
  HueLegend: the model's tree (`hueLegendView`, HueLegend.model.ts) drawn by the Svelte `Tree`, as
  `HueLegend.tsx` draws it with the React one; see HueLegend.tsx for the job and the tuning knobs.
-->
<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { hueLegendView, type HueLegendProps } from './HueLegend.model';
  import '../../../primitives/Stack/Stack.css';
  import '../../../primitives/Text/Text.css';
  import './HueLegend.css';

  let props: HueLegendProps = $props();
</script>

<Tree tree={hueLegendView(props)} />
