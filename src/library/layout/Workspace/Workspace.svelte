<!--
  Workspace: the model's tree (`workspaceView`, Workspace.model.ts) drawn by the Svelte `Tree`, as
  `Workspace.tsx` draws it with the React one; see Workspace.tsx for the job, the line between the
  app and the surface, and the tuning knobs. `pane` is a snippet taking the instance, its target and its settings.
  The surface's own visual state is view state here (`view/viewState.ts`).
-->
<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../view/Tree.svelte';
  import { viewState } from '../../view/viewState';
  import { contentSlot, surfaceUi, workspaceContent, workspaceHandlers, workspaceView, type WorkspaceModelProps } from './Workspace.model';
  import { SURFACE_UI_REST, type ResolvedSettings, type SurfaceRegion, type SurfaceUi } from './Workspace.types';
  import { scopePrinciples } from '../assembly/principles.svelte';
  import '../../primitives/Text.css';
  import './Workspace.css';

  interface Props extends Omit<WorkspaceModelProps, 'className'> {
    class?: string;
    pane?: Snippet<[SurfaceRegion, string | undefined, ResolvedSettings]>;
  }

  let { class: className, pane, ...props }: Props = $props();
  const own = untrack(() => viewState<SurfaceUi>(SURFACE_UI_REST));
  const value = fromStore(own);
  const scope = scopePrinciples();
  const ui = $derived(surfaceUi(props, value.current));
  const slots = $derived(Object.fromEntries(pane ? workspaceContent(props).map(({ region }) => [contentSlot(region.id), pane]) : []));
  const handlers = $derived(workspaceHandlers(props, ui, own));
</script>

<Tree tree={workspaceView({ ...props, className }, ui, { principles: scope.current })} {slots} {handlers} />
