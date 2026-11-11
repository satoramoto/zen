<!--
  Trace: the model's tree (`traceView`, Trace.model.ts) drawn by the Svelte `Tree`, as `Trace.tsx`
  draws it with the React one; see Trace.tsx for the job and the parts.
-->
<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { traceView, type TraceModelProps } from './Trace.model';
  import './Trace.css';

  let props: TraceModelProps = $props();
</script>

<Tree tree={traceView(props)} />
