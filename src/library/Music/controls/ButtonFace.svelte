<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { buttonFaceHandlers, buttonFaceView, type ButtonFaceModelProps } from './ButtonFace.model';
  import './pressables.css';
  let { children, ...props }: ButtonFaceModelProps & { children?: Snippet } = $props();
</script>

<Tree tree={buttonFaceView(props)} handlers={buttonFaceHandlers(props)} slots={{ children }} />
