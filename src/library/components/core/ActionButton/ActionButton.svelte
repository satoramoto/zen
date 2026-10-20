<!--
  ActionButton: the model's tree (`actionButtonView`, ActionButton.model.ts) drawn by the Svelte
  `Tree`, as `ActionButton.tsx` draws it with the React one; see ActionButton.tsx for the job. The
  face's content is the `children` snippet.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../../view/Tree.svelte';
  import { actionButtonHandlers, actionButtonView, type ActionButtonModelProps } from './ActionButton.model';
  import '../../../primitives/Text.css';
  import './ActionButton.css';

  interface Props extends ActionButtonModelProps {
    /** The face's content: an icon, a word, both. */
    children?: Snippet;
  }

  let { children, ...props }: Props = $props();
</script>

<Tree tree={actionButtonView(props)} slots={{ children }} handlers={actionButtonHandlers(props)} />
