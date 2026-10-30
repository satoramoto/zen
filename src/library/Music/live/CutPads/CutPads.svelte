<!-- CutPads: the model's tree drawn by the Svelte `Tree`, as CutPads.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { CUT_PADS_FORMS } from './CutPads.forms';
  import { cutPadsHandlers, cutPadsView, type CutPadsProps } from './CutPads.model';
  import '../../base.css';
  import '../live.css';
  import './CutPads.css';

  interface Props extends Omit<CutPadsProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(CUT_PADS_FORMS, () => props.form);
</script>

<Tree tree={cutPadsView({ ...props, className }, form.current)} handlers={cutPadsHandlers(props)} />
