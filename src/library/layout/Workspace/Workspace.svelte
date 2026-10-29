<!--
  Workspace: the model's tree (`workspaceView`, Workspace.model.ts) drawn by the Svelte `Tree`, as
  `Workspace.tsx` draws it with the React one; see Workspace.tsx for the job and the tuning knobs.
  Each region's content is a snippet in `content`, under its content slot.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { workspaceHandlers, workspaceSlots, workspaceTab, workspaceView, type WorkspaceModelProps } from './Workspace.model';
  import '../../primitives/Text.css';
  import './Workspace.css';

  interface Props extends Omit<WorkspaceModelProps, 'className'> {
    class?: string;
    content?: Record<string, Snippet>;
  }

  let { class: className, content, ...props }: Props = $props();
  const tab = $derived(workspaceTab(props));
  const slots = $derived(workspaceSlots(tab, content));
  const handlers = $derived(workspaceHandlers(props));
</script>

<Tree tree={workspaceView({ ...props, className }, tab)} {slots} {handlers} />
