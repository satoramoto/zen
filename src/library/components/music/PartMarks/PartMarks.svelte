<!--
  PartMarks: the model's tree (`partMarksView`, PartMarks.model.ts) drawn by the Svelte `Tree`, as
  `PartMarks.tsx` draws it with the React one; see PartMarks.tsx for the job. Nothing is drawn when
  no mark shows; the app's tooltip is the `tip` store the tree binds, so it lives only while one does.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { partMarksHandlers, partMarksView, type PartMarksModelProps } from './PartMarks.model';
  import '../../../primitives/Text.css';
  import './PartMarks.css';

  let props: PartMarksModelProps = $props();
  const tree = $derived(partMarksView(props));
</script>

{#if tree}<Tree {tree} handlers={partMarksHandlers(props)} />{/if}
