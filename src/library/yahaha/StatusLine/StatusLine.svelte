<!--
  StatusLine: the model's tree (`statusLineView`, StatusLine.model.ts) drawn by the Svelte `Tree`,
  as `StatusLine.tsx` draws it with the React one; see StatusLine.tsx for the job and what changed.
  The message's contents are keyed on `seq`, so a repeat is announced again.
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { statusLineHandlers, statusLineView, type StatusLineModelProps } from './StatusLine.model';
  import '../../primitives/Text.css';
  import './StatusLine.css';

  let props: StatusLineModelProps = $props();
</script>

<Tree tree={statusLineView(props)} handlers={statusLineHandlers(props)} />
