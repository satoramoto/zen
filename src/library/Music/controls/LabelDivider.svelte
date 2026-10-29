<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { dividerView, type DividerModelProps } from './Label.model';
  import './pressables.css';
  let props: DividerModelProps = $props();
</script>

<Tree tree={dividerView(props)} />
