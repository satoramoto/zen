<!--
  BarBeat: the model's tree (`barBeatView`, BarBeat.model.ts) drawn by the Svelte `Tree`, as
  `BarBeat.tsx` draws it with the React one; see BarBeat.tsx for the job and the tuning knobs.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { barBeatView, type BarBeatModelProps } from './BarBeat.model';
  import './BarBeat.css';

  let props: BarBeatModelProps = $props();
</script>

<Tree tree={barBeatView(props)} />
