<!--
  Gate: the model's tree (`gateView`, Gate.model.ts) drawn by the Svelte `Tree`, as `Gate.tsx`
  draws it with the React one; see Gate.tsx for the job and the parts. `title`, `message` and
  `children` are snippets; the gate's own state (the key, revealed, busy, the last error) is view
  state here (`view/viewState.ts`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../../../view/viewState';
  import { gateHandlers, gateState, gateView, type GateModelProps } from './Gate.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Stack.css';
  import '../../../primitives/Surface.css';
  import './Gate.css';

  interface Props extends GateModelProps {
    /** Above the field, as the page's heading. */
    title?: Snippet;
    /** Under the title: what the gate is and where the key comes from. */
    message?: Snippet;
    /** Anything the app adds under the submit key. */
    children?: Snippet;
  }

  let { title, message, children, ...props }: Props = $props();
  const own = viewState(gateState());
  const state = fromStore(own);
  const slots = $derived({ title: title !== undefined, message: message !== undefined, children: children !== undefined });
</script>

<Tree tree={gateView(props, state.current, slots)} slots={{ title, message, children }} handlers={gateHandlers(props, own)} />
