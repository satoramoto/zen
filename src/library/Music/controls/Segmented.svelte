<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { segmentedHandlers, segmentedView, type SegmentedModelProps } from './Segmented.model';
  import './pressables.css';
  let props: SegmentedModelProps = $props();
</script>

<Tree tree={segmentedView(props)} handlers={segmentedHandlers(props)} />
