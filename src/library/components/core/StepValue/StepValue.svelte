<!--
  StepValue: the model's tree (`stepValueView`, StepValue.model.ts) drawn by the Svelte `Tree`, as
  `StepValue.tsx` draws it with the React one; see StepValue.tsx for the job and the tuning knobs.
  The drag, wheel and keys are the `stepAdjust` store the tree binds (`adjust.ts`).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { stepValueHandlers, stepValueView, type StepValueModelProps } from './StepValue.model';
  import '../../../primitives/Text.css';
  import './StepValue.css';

  let props: StepValueModelProps = $props();
</script>

<Tree tree={stepValueView(props)} handlers={stepValueHandlers(props)} />
