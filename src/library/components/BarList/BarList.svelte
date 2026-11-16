<!--
  BarList: the model's tree (`barListView`, BarList.model.ts) drawn by the Svelte `Tree`, as `BarList.tsx` draws it with the React one.
-->
<script lang="ts">
  import Tree from '../../foundation/view/Tree.svelte';
  import { barListView, type BarListModelProps } from './BarList.model';
  import '../../primitives/Text/Text.css';
  import './BarList.css';

  let props: BarListModelProps = $props();
</script>

<Tree tree={barListView(props)} />
