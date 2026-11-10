<!--
  TransportBar: the model's tree (`transportView`, TransportBar.model.ts) drawn by the Svelte `Tree`, as
  `TransportBar.tsx` draws it with the React one; see TransportBar.tsx for the job, the forms and the knobs.
-->
<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { getForm } from '../../../layouts/Assembly/forms.svelte';
  import { TRANSPORT_FORMS } from './TransportBar.forms';
  import { transportHandlers, transportView, type TransportBarModelProps } from './TransportBar.model';
  import '../../../primitives/Text/Text.css';
  import './TransportBar.css';

  interface Props extends Omit<TransportBarModelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(TRANSPORT_FORMS);
</script>

<Tree tree={transportView({ ...props, className }, form.current)} handlers={transportHandlers(props)} />
