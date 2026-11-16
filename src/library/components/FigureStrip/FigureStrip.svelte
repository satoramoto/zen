<!--
  FigureStrip: the model's tree (`figureStripView`, FigureStrip.model.ts) drawn by the Svelte `Tree`, as `FigureStrip.tsx` draws it with the React one.
-->
<script lang="ts">
  import Tree from '../../foundation/view/Tree.svelte';
  import { figureStripView, type FigureStripModelProps } from './FigureStrip.model';
  import '../../primitives/Text/Text.css';
  import './FigureStrip.css';

  let props: FigureStripModelProps = $props();
</script>

<Tree tree={figureStripView(props)} />
