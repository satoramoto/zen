<!--
  Transport: the model's tree (`transportView`, Transport.model.ts) drawn by the Svelte `Tree`, as
  `Transport.tsx` draws it with the React one; see Transport.tsx for the job, the forms and the knobs.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { TRANSPORT_FORMS } from './Transport.forms';
  import { transportHandlers, transportView, type TransportModelProps } from './Transport.model';
  import '../../../primitives/Text.css';
  import './Transport.css';

  interface Props extends Omit<TransportModelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(TRANSPORT_FORMS);
</script>

<Tree tree={transportView({ ...props, className }, form.current)} handlers={transportHandlers(props)} />
