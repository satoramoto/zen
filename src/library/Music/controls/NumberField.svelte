<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../../view/Tree.svelte';
  import { viewState } from '../../view/viewState';
  import { numberFieldHandlers, numberFieldView, type NumberFieldProps } from './NumberField.model';
  import './parameters.css';
  let props: NumberFieldProps = $props();
  const draft = viewState<string | null>(null);
  const typed = fromStore(draft);
</script>
<Tree tree={numberFieldView(props, typed.current)} handlers={numberFieldHandlers(props, draft.set)} />
