<!-- ChordCompass: the model's tree drawn by the Svelte `Tree`, as ChordCompass.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { CHORD_COMPASS_FORMS } from './ChordCompass.forms';
  import { chordCompassHandlers, chordCompassView, type ChordCompassProps } from './ChordCompass.model';
  import '../../base.css';
  import '../live.css';
  import './ChordCompass.css';

  interface Props extends Omit<ChordCompassProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(CHORD_COMPASS_FORMS, () => props.form);
</script>

<Tree tree={chordCompassView({ ...props, className }, form.current)} handlers={chordCompassHandlers(props)} />
