<!--
  SongForm: the model's tree (`songFormView`, SongForm.model.ts) drawn by the Svelte `Tree`, as
  `SongForm.tsx` draws it with the React one; see SongForm.tsx for the job, the forms and the
  tuning knobs. Each half reads its form with `getForm` (forms.svelte.ts), as React's `useForm`.
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { getForm } from '../../layout/assembly/forms.svelte';
  import { FORM_FORMS, TRANSPORT_FORMS } from './SongForm.forms';
  import { songFormHandlers, songFormView, type SongFormProps } from './SongForm.model';
  import '../../primitives/Stack.css';
  import '../../primitives/Text.css';
  import './SongForm.css';

  let props: SongFormProps = $props();
  const formId = getForm(FORM_FORMS, () => props.formForm, 'form');
  const transportId = getForm(TRANSPORT_FORMS, () => props.transportForm, 'transport');
</script>

<Tree tree={songFormView(props, formId.current, transportId.current)} handlers={songFormHandlers(props)} />
