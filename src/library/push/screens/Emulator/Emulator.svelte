<!--
  Emulator: the model's tree (`emulatorView`, Emulator.model.ts) drawn by the Svelte `Tree`, as
  `Emulator.tsx` draws it with the React one; see Emulator.tsx for the job. The Set the stand-in
  host keeps and the log are view state here.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../../foundation/view/Tree.svelte';
  import { viewState } from '../../../foundation/view/viewState';
  import { emulatorHandlers, emulatorView, type EmulatorModelProps, type EmulatorState } from './Emulator.model';
  import '../../../primitives/Text/Text.css';
  import './Emulator.css';

  let props: EmulatorModelProps = $props();
  const own = viewState<EmulatorState>(untrack(() => ({ set: props.set, log: [] })));
  const value = fromStore(own);
</script>

<Tree tree={emulatorView(props, value.current)} handlers={emulatorHandlers(props, own)} />
