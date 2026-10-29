<!--
  LoopGrid: the model's tree (`loopGridView`, LoopGrid.model.ts) drawn by the Svelte `Tree`, as
  `LoopGrid.tsx` draws it with the React one; see LoopGrid.tsx for the job, the forms and the knobs.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { LOOP_GRID_FORMS } from './LoopGrid.forms';
  import { loopGridHandlers, loopGridView, type LoopGridModelProps } from './LoopGrid.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './LoopGrid.css';

  interface Props extends Omit<LoopGridModelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(LOOP_GRID_FORMS);
</script>

<Tree tree={loopGridView({ ...props, className }, form.current)} handlers={loopGridHandlers(props)} />
