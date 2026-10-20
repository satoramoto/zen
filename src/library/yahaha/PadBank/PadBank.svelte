<!--
  PadBank: the model's tree (`padBankView`, PadBank.model.ts) drawn by the Svelte `Tree`, as
  `PadBank.tsx` draws it with the React one; see PadBank.tsx for the job. The form comes from
  `getForm` / `getChosenForm`, as React's `useForm` / `useChosenForm`.
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { getChosenForm, getForm } from '../../layout/assembly/forms.svelte';
  import { PAD_BANK_FORMS, padBankHandlers, padBankView, type PadBankProps } from './PadBank.model';
  import './PadBank.css';

  let props: PadBankProps = $props();
  const form = getForm(PAD_BANK_FORMS, () => props.form);
  const chosen = getChosenForm();
</script>

<Tree tree={padBankView(props, form.current, chosen.current)} handlers={padBankHandlers(props)} />
