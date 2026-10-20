<!--
  StatusDot: the model's tree (`statusDotView`, StatusDot.model.ts) drawn by the Svelte `Tree`, as
  `StatusDot.tsx` draws it with the React one; see StatusDot.tsx for the job and the tuning knobs.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { statusDotView, type StatusDotModelProps } from './StatusDot.model';
  import './StatusDot.css';

  let props: StatusDotModelProps = $props();
</script>

<Tree tree={statusDotView(props)} />
