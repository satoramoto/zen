<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../../foundation/view/Tree.svelte';
  import { getForm } from '../../../layouts/Assembly/forms.svelte';
  import { viewState } from '../../../foundation/view/viewState';
  import { TRANSPORT_FORMS } from './Transport.forms';
  import { transportHandlers, transportView, type TransportModelProps, type TransportUnit } from './Transport.model';
  import '../pressables.css';
  import './Transport.css';

  let { children, ...props }: TransportModelProps & { children?: Snippet } = $props();
  const state = viewState<TransportUnit>('beats');
  const unit = fromStore(state);
  const form = getForm(TRANSPORT_FORMS);
</script>

<Tree tree={transportView(props, unit.current, form.current)} handlers={transportHandlers(props, state.set, state.get)} slots={{ children }} />
