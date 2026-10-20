<!--
  Switch: the model's tree (`switchView`, Toggle.model.ts) drawn by the Svelte `Tree`, as `Switch`
  in `Toggle.tsx` draws it with the React one; see there for the job and the parts. The name beside
  it is the `children` snippet; its own value (unless `checked` owns it) is view state here
  (`view/viewState.ts`).
-->
<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../../../view/viewState';
  import { switchHandlers, switchView, type SwitchModelProps } from './Toggle.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './size.css';
  import './Toggle.css';

  interface Props extends SwitchModelProps {
    /** A name beside it: the switch at the end of a line that labels it. */
    children?: Snippet;
  }

  let { children, ...props }: Props = $props();
  const own = viewState(untrack(() => props.defaultChecked ?? false));
  const value = fromStore(own);
</script>

<Tree tree={switchView(props, value.current, children !== undefined)} slots={{ children }} handlers={switchHandlers(props, value.current, own.set)} />
