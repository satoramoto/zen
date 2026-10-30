<!-- ThrowPads: the model's tree drawn by the Svelte `Tree`, as ThrowPads.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { THROW_PADS_FORMS } from './ThrowPads.forms';
  import { throwPadsHandlers, throwPadsView, type ThrowPadsProps } from './ThrowPads.model';
  import '../../base.css';
  import '../live.css';
  import './ThrowPads.css';

  interface Props extends Omit<ThrowPadsProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(THROW_PADS_FORMS, () => props.form);
</script>

<Tree tree={throwPadsView({ ...props, className }, form.current)} handlers={throwPadsHandlers(props)} />
