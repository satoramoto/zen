<!--
  NamePicker: the model's tree (`namePickerView`, NamePicker.model.ts) drawn by the Svelte `Tree`,
  as `NamePicker.tsx` draws it with the React one; see NamePicker.tsx for the job and the parts.
  `title`, `message` and `children` are snippets; the name chosen so far is view state here
  (`foundation/view/viewState.ts`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../foundation/view/Tree.svelte';
  import { viewState } from '../../foundation/view/viewState';
  import { namePickerHandlers, namePickerState, namePickerView, type NamePickerModelProps } from './NamePicker.model';
  import '../../primitives/Text/Text.css';
  import '../../primitives/Stack/Stack.css';
  import '../../primitives/Surface/Surface.css';
  import './NamePicker.css';

  interface Props extends NamePickerModelProps {
    /** Above the names, as the page's heading; it names the list. */
    title?: Snippet;
    /** Under the title: what picking a name does. */
    message?: Snippet;
    /** Anything the app adds under the pick key. */
    children?: Snippet;
  }

  let { title, message, children, ...props }: Props = $props();
  // svelte-ignore state_referenced_locally
  const own = viewState(namePickerState(props.value));
  const state = fromStore(own);
  const slots = $derived({ title: title !== undefined, message: message !== undefined, children: children !== undefined });
</script>

<Tree tree={namePickerView(props, state.current, slots)} slots={{ title, message, children }} handlers={namePickerHandlers(props, own)} />
