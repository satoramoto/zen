<!--
  KnobReadout: the model's tree (`knobView`, KnobReadout.model.ts) drawn by the Svelte `Tree`, as `KnobReadout.tsx`
  draws it with the React one; see KnobReadout.tsx for the job and the tuning knobs. The input (drag,
  keys, wheel, press, tooltip) is the `knob` store the tree binds (`knobInput.ts`).
-->
<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { knobHandlers, knobView, type KnobReadoutModelProps } from './KnobReadout.model';
  import '../../../primitives/Text/Text.css';
  import '../../../primitives/Surface/Surface.css';
  import './KnobReadout.css';

  let props: KnobReadoutModelProps = $props();
</script>

<Tree tree={knobView(props)} handlers={knobHandlers(props)} />
