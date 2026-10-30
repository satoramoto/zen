<!-- RigHealth: the model's tree drawn by the Svelte `Tree`, as RigHealth.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { RIG_HEALTH_FORMS } from './RigHealth.forms';
  import { rigHealthHandlers, rigHealthView, type RigHealthProps } from './RigHealth.model';
  import '../../base.css';
  import '../live.css';
  import './RigHealth.css';

  interface Props extends Omit<RigHealthProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(RIG_HEALTH_FORMS, () => props.form);
</script>

<Tree tree={rigHealthView({ ...props, className }, form.current)} handlers={rigHealthHandlers(props)} />
