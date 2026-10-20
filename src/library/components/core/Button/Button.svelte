<!--
  Button: the model's tree (`buttonView`, Button.model.ts) drawn by the Svelte `Tree`, as
  `Button.tsx` draws it with the React one; see Button.tsx for the job, the faces and the tuning
  knobs. `icon` is a snippet.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../../view/Tree.svelte';
  import { buttonHandlers, buttonView, type ButtonModelProps } from './Button.model';
  import '../../../primitives/Text.css';
  import './Button.css';

  interface Props extends ButtonModelProps {
    /** An icon before the label, or alone, drawn in the face's ink and hidden from assistive tech. */
    icon?: Snippet;
  }

  let { icon, ...props }: Props = $props();
</script>

<Tree tree={buttonView(props, { icon: icon !== undefined })} slots={{ icon }} handlers={buttonHandlers(props)} />
