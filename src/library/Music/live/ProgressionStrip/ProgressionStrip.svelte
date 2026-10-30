<!-- ProgressionStrip: the model's tree drawn by the Svelte `Tree`, as ProgressionStrip.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { PROGRESSION_STRIP_FORMS } from './ProgressionStrip.forms';
  import { progressionStripHandlers, progressionStripView, type ProgressionStripProps } from './ProgressionStrip.model';
  import '../../base.css';
  import '../live.css';
  import './ProgressionStrip.css';

  interface Props extends Omit<ProgressionStripProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(PROGRESSION_STRIP_FORMS, () => props.form);
</script>

<Tree tree={progressionStripView({ ...props, className }, form.current)} handlers={progressionStripHandlers(props)} />
