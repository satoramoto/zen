<!-- LaunchGrid: the model's tree drawn by the Svelte `Tree`, as LaunchGrid.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { LAUNCH_GRID_FORMS } from './LaunchGrid.forms';
  import { launchGridHandlers, launchGridView, type LaunchGridProps } from './LaunchGrid.model';
  import '../../base.css';
  import '../live.css';
  import './LaunchGrid.css';

  interface Props extends Omit<LaunchGridProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(LAUNCH_GRID_FORMS, () => props.form);
</script>

<Tree tree={launchGridView({ ...props, className }, form.current)} handlers={launchGridHandlers(props)} />
