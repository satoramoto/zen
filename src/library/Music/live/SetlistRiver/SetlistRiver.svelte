<!-- SetlistRiver: the model's tree drawn by the Svelte `Tree`, as SetlistRiver.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { SETLIST_RIVER_FORMS } from './SetlistRiver.forms';
  import { setlistRiverHandlers, setlistRiverView, type SetlistRiverProps } from './SetlistRiver.model';
  import '../../base.css';
  import '../live.css';
  import './SetlistRiver.css';

  interface Props extends Omit<SetlistRiverProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(SETLIST_RIVER_FORMS, () => props.form);
</script>

<Tree tree={setlistRiverView({ ...props, className }, form.current)} handlers={setlistRiverHandlers(props)} />
