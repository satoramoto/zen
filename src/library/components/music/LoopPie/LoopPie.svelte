<!--
  LoopPie: the model's tree (`loopPieView`, LoopPie.model.ts) drawn by the Svelte `Tree`, as
  `LoopPie.tsx` draws it with the React one; see LoopPie.tsx for the job, the forms and the knobs.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { LOOP_PIE_FORMS } from './LoopPie.forms';
  import { loopPieHandlers, loopPieView, type LoopPieModelProps } from './LoopPie.model';
  import '../../../primitives/Text.css';
  import './LoopPie.css';

  interface Props extends Omit<LoopPieModelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(LOOP_PIE_FORMS);
</script>

<Tree tree={loopPieView({ ...props, className }, form.current)} handlers={loopPieHandlers()} />
