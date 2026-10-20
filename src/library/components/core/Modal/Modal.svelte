<!--
  Modal: the model's tree (`modalView`, Modal.model.ts) drawn by the Svelte `Tree`, as `Modal.tsx`
  draws it with the React one; see Modal.tsx for the job. The body is the `children` snippet, the
  buttons along the bottom the `actions` snippet. Focus and Esc are the `focusTrap` and
  `dialogEscape` stores (`dialog.ts`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../../view/Tree.svelte';
  import { modalHandlers, modalView, type ModalModelProps } from './Modal.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import '../ActionButton/ActionButton.css';
  import './Modal.css';

  interface Props extends ModalModelProps {
    /** The buttons along the bottom. The one that does the thing goes first. */
    actions?: Snippet;
    children?: Snippet;
  }

  let { actions, children, ...props }: Props = $props();
</script>

<Tree tree={modalView(props, { actions: actions !== undefined })} slots={{ children, actions }} handlers={modalHandlers(props)} />
