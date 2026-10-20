<!--
  Knob: the model's tree (`knobView`, Knob.model.ts) drawn by the Svelte `Tree`, as `Knob.tsx`
  draws it with the React one; see Knob.tsx for the job and the tuning knobs. The input (drag,
  keys, wheel, press, tooltip) is the `knob` store the tree binds (`knobInput.ts`).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { knobHandlers, knobView, type KnobModelProps } from './Knob.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './Knob.css';

  let props: KnobModelProps = $props();
</script>

<Tree tree={knobView(props)} handlers={knobHandlers(props)} />
