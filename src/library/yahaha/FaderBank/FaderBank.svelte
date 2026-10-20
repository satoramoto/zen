<!--
  FaderBank: the model's tree (`faderBankView`, FaderBank.model.ts) drawn by the Svelte `Tree`, as
  `FaderBank.tsx` draws it with the React one; see FaderBank.tsx for the job. The form is `getForm`
  (React's `useForm`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { getForm } from '../../layout/assembly/forms.svelte';
  import { FADER_BANK_FORMS } from './FaderBank.forms';
  import { faderBankHandlers, faderBankView, type FaderBankModelProps } from './FaderBank.model';
  import '../../primitives/Stack.css';
  import '../../primitives/Text.css';
  import './FaderBank.css';

  let props: FaderBankModelProps<string | Snippet> = $props();
  const form = getForm(FADER_BANK_FORMS, () => props.form);
</script>

<Tree tree={faderBankView(props, form.current)} handlers={faderBankHandlers(props)} />
