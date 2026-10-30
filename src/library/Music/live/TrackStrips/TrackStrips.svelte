<!-- TrackStrips: the model's tree drawn by the Svelte `Tree`, as TrackStrips.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { TRACK_STRIPS_FORMS } from './TrackStrips.forms';
  import { trackStripsHandlers, trackStripsView, type TrackStripsProps } from './TrackStrips.model';
  import '../../base.css';
  import '../live.css';
  import './TrackStrips.css';

  interface Props extends Omit<TrackStripsProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(TRACK_STRIPS_FORMS, () => props.form);
</script>

<Tree tree={trackStripsView({ ...props, className }, form.current)} handlers={trackStripsHandlers(props)} />
