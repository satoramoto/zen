<!-- PushTwin: the model's tree drawn by the Svelte `Tree`, as PushTwin.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { PUSH_TWIN_FORMS } from './PushTwin.forms';
  import { pushTwinHandlers, pushTwinView, type PushTwinProps } from './PushTwin.model';
  import '../../base.css';
  import '../live.css';
  import './PushTwin.css';

  interface Props extends Omit<PushTwinProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(PUSH_TWIN_FORMS, () => props.form);
</script>

<Tree tree={pushTwinView({ ...props, className }, form.current)} handlers={pushTwinHandlers(props)} />
