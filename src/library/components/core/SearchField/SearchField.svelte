<!--
  SearchField: the model's tree (`searchFieldView`, SearchField.model.ts) drawn by the Svelte `Tree`,
  as `SearchField.tsx` draws it with the React one; see SearchField.tsx for the job. `bind:ref` is
  the `<input>` (the `ref` store, through the `ref` handler).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { searchFieldHandlers, searchFieldView, type SearchFieldModelProps } from './SearchField.model';
  import '../../../primitives/Text.css';
  import './SearchField.css';

  interface Props extends SearchFieldModelProps {
    /** The `<input>` itself, so the page can focus it (a ⌘F shortcut) or read its selection. */
    ref?: HTMLInputElement | null;
  }

  let { ref = $bindable(null), ...props }: Props = $props();
  const handlers = $derived(searchFieldHandlers({ ...props, ref: (element: HTMLInputElement | null) => (ref = element) }));
</script>

<Tree tree={searchFieldView(props)} {handlers} />
