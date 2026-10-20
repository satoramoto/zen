<!--
  Radio: the model's tree (`radioView`, Radio.model.ts) drawn by the Svelte `Tree`, as `Radio.tsx`
  draws it with the React one; see Radio.tsx for the job and the parts. The label is the `children`
  snippet; the uncontrolled radio's own mixed state is view state (`view/viewState.ts`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../../../view/viewState';
  import { radioHandlers, radioView, type RadioModelProps } from './Radio.model';
  import '../../../primitives/Text.css';
  import '../Toggle/size.css';
  import '../Checkbox/Checkbox.css';
  import './Radio.css';

  interface Props extends RadioModelProps {
    /** The label beside the box; without one, give `aria-label`. */
    children?: Snippet;
  }

  let { children, ...props }: Props = $props();
  // Its own mixed state (uncontrolled): from `defaultChecked`, ended by the first pick.
  // svelte-ignore state_referenced_locally
  const ownMixed = viewState(props.defaultChecked === 'mixed');
  const mixed = fromStore(ownMixed);
</script>

<Tree tree={radioView(props, { label: children !== undefined }, mixed.current)} slots={{ children }} handlers={radioHandlers(props, ownMixed.set)} />
