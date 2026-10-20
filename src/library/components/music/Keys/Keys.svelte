<!--
  Keys: the model's tree (`keysView`, Keys.model.ts) drawn by the Svelte `Tree`, as `Keys.tsx`
  draws it with the React one; see Keys.tsx for the job, the width and the tuning knobs. The input
  is the `keysInput` store the tree binds on the root (`keysInput.ts`), the measured width the
  `fillWidth` store (`fillWidth.ts`), kept here as view state (`viewState.ts`).
-->
<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../viewState';
  import { keysHandlers, keysView, type KeysModelProps } from './Keys.model';
  import '../../../primitives/Text.css';
  import './Keys.css';

  let props: KeysModelProps = $props();
  const width = viewState(0);
  const measured = fromStore(width);
</script>

<Tree tree={keysView(props, measured.current)} handlers={keysHandlers(props, width.set)} />
