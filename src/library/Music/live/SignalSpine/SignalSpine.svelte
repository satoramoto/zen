<!-- SignalSpine: the model's tree drawn by the Svelte `Tree`, as SignalSpine.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { SIGNAL_SPINE_FORMS } from './SignalSpine.forms';
  import { signalSpineHandlers, signalSpineView, type SignalSpineProps } from './SignalSpine.model';
  import '../../base.css';
  import '../live.css';
  import './SignalSpine.css';

  interface Props extends Omit<SignalSpineProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(SIGNAL_SPINE_FORMS, () => props.form);
</script>

<Tree tree={signalSpineView({ ...props, className }, form.current)} handlers={signalSpineHandlers(props)} />
