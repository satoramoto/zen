<!--
  PianoRoll: the model's tree (`pianoRollView`, PianoRoll.model.ts) drawn by the Svelte `Tree`, as
  `PianoRoll.tsx` draws it with the React one; see PianoRoll.tsx for the job, the forms and the knobs.
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { PIANO_ROLL_FORMS } from './PianoRoll.forms';
  import { pianoRollHandlers, pianoRollView, type PianoRollModelProps } from './PianoRoll.model';
  import './PianoRoll.css';

  interface Props extends Omit<PianoRollModelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(PIANO_ROLL_FORMS);
</script>

<Tree tree={pianoRollView({ ...props, className }, form.current)} handlers={pianoRollHandlers()} />
