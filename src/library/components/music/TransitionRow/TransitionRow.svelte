<!--
  TransitionRow: the model's tree (`transitionRowView`, TransitionRow.model.ts) drawn by the Svelte
  `Tree`, as `TransitionRow.tsx` draws it with the React one; see TransitionRow.tsx for the job, the
  forms and the tuning knobs. The form is `getForm` (React's `useForm`).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { TRANSITION_ROW_FORMS } from './TransitionRow.forms';
  import { transitionRowHandlers, transitionRowView, type TransitionRowModelProps } from './TransitionRow.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './TransitionRow.css';

  interface Props extends Omit<TransitionRowModelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(TRANSITION_ROW_FORMS);
</script>

<Tree tree={transitionRowView({ ...props, className }, form.current)} handlers={transitionRowHandlers(props)} />
