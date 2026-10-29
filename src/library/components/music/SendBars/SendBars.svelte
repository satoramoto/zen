<!--
  SendBars: the model's tree (`sendBarsView`, SendBars.model.ts) drawn by the Svelte `Tree`, as
  `SendBars.tsx` draws it with the React one; see SendBars.tsx for the job, the forms and the knobs.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { SEND_BARS_FORMS } from './SendBars.forms';
  import { sendBarsHandlers, sendBarsView, type SendBarsModelProps } from './SendBars.model';
  import '../../../primitives/Text.css';
  import './SendBars.css';

  interface Props extends Omit<SendBarsModelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(SEND_BARS_FORMS);
</script>

<Tree tree={sendBarsView({ ...props, className }, form.current)} handlers={sendBarsHandlers(props)} />
