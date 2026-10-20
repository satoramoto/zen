<!--
  NumberField: the model's tree (`numberFieldView`, NumberField.model.ts) drawn by the Svelte `Tree`,
  as `NumberField.tsx` draws it with the React one; see NumberField.tsx for the job and the parts.
  The drag, keys and editor are the `numberField` and `numberFieldEditor` stores the tree binds
  (`numberFieldInput.ts`); the text being typed is kept here as view state (`viewState.ts`).
-->
<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../../../view/viewState';
  import { numberFieldHandlers, numberFieldView, type NumberFieldModelProps } from './NumberField.model';
  import '../../../primitives/Text.css';
  import './NumberField.css';

  let props: NumberFieldModelProps = $props();
  const draft = viewState<string | null>(null);
  const typed = fromStore(draft);
</script>

<Tree tree={numberFieldView(props, typed.current)} handlers={numberFieldHandlers(props, draft.set)} />
