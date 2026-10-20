<!--
  Toggle: the model's tree (`toggleView`, Toggle.model.ts) drawn by the Svelte `Tree`, as
  `Toggle.tsx` draws it with the React one; see Toggle.tsx for the job and the parts. The face
  (stacked) or the reading (inside) is the `children` snippet.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../../view/Tree.svelte';
  import { toggleHandlers, toggleView, type ToggleModelProps } from './Toggle.model';
  import '../../../primitives/Text.css';
  import './size.css';
  import './Toggle.css';

  interface Props extends ToggleModelProps {
    /** The face (stacked) or the reading (inside). */
    children?: Snippet;
  }

  let { children, ...props }: Props = $props();
</script>

<Tree tree={toggleView(props, children !== undefined)} slots={{ children }} handlers={toggleHandlers(props)} />
