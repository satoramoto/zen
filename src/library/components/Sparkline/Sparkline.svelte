<!--
  Sparkline: the model's tree (`sparklineView`, Sparkline.model.ts) drawn by the Svelte `Tree`, as `Sparkline.tsx` draws it with the React one.
-->
<script lang="ts">
  import Tree from '../../foundation/view/Tree.svelte';
  import { sparklineView, type SparklineModelProps } from './Sparkline.model';
  import './Sparkline.css';

  let props: SparklineModelProps = $props();
</script>

<Tree tree={sparklineView(props)} />
