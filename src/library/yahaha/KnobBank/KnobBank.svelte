<!--
  KnobBank: the model's tree (`knobBankView`, KnobBank.model.ts) drawn by the Svelte `Tree`, as
  `KnobBank.tsx` draws it with the React one; see KnobBank.tsx for the job, the forms and the tuning
  knobs. The form is `getForm` (a `form` prop wins over the assembled screen's choice).
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { getForm } from '../../layout/assembly/forms.svelte';
  import { KNOB_BANK_FORMS, knobBankHandlers, knobBankView, type KnobBankProps } from './KnobBank.model';
  import './KnobBank.css';

  let props: KnobBankProps = $props();
  const form = getForm(KNOB_BANK_FORMS, () => props.form);
</script>

<Tree tree={knobBankView(props, form.current)} handlers={knobBankHandlers(props)} />
