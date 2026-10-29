<!--
  StemLanes: the model's tree (`stemLanesView`, StemLanes.model.ts) drawn by the Svelte `Tree`, as
  `StemLanes.tsx` draws it with the React one; see StemLanes.tsx for the job, the forms and the
  tuning knobs. The form is read with `getForm` (forms.svelte.ts), as React's `useForm`.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { STEM_LANES_FORMS } from './StemLanes.forms';
  import { stemLanesHandlers, stemLanesView, type StemLanesModelProps } from './StemLanes.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './StemLanes.css';

  let props: StemLanesModelProps = $props();
  const form = getForm(STEM_LANES_FORMS);
</script>

<Tree tree={stemLanesView(props, form.current)} handlers={stemLanesHandlers(props)} />
