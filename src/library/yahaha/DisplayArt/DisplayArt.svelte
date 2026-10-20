<!--
  DisplayArt: the model's tree (`displayArtView`, DisplayArt.model.ts) drawn by the Svelte `Tree`,
  as `DisplayArt.tsx` draws it with the React one; see DisplayArt.tsx for the job and the tuning knobs.
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { displayArtView, type DisplayArtModelProps } from './DisplayArt.model';
  import './DisplayArt.css';

  let props: DisplayArtModelProps = $props();
</script>

<Tree tree={displayArtView(props)} />
