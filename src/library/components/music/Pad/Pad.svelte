<!--
  Pad: the model's tree (`padView`, Pad.model.ts) drawn by the Svelte `Tree`, as `Pad.tsx` draws
  it with the React one; see Pad.tsx for the job, the faces and the tuning knobs. The press and the
  tooltip are the `padPress` store the tree binds (`padPress.ts`). The face is a Surface through its
  class and data attributes (no shader).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { padHandlers, padView, type PadModelProps } from './Pad.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './Pad.css';

  let props: PadModelProps = $props();
</script>

<Tree tree={padView(props)} handlers={padHandlers(props)} />
