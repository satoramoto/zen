<!-- ControlPanel: the model's tree drawn by the Svelte `Tree`, as ControlPanel.tsx draws it with React's; its own visual state is view state here, the surface's mode read from its context. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../../../view/viewState';
  import { building } from '../../../layout/Workspace/surfaceMode';
  import { getSurfaceMode } from '../../../layout/Workspace/surfaceMode.svelte';
  import { CONTROL_PANEL_REST, controlPanelHandlers, controlPanelView, type ControlPanelProps, type ControlPanelUi } from './ControlPanel.model';
  import '../../base.css';
  import '../live.css';
  import './ControlPanel.css';

  interface Props extends Omit<ControlPanelProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const own = untrack(() => viewState<ControlPanelUi>(CONTROL_PANEL_REST));
  const ui = fromStore(own);
  const mode = getSurfaceMode();
</script>

<Tree tree={controlPanelView({ ...props, className }, ui.current, building(mode.current) && props.onCells !== undefined)} handlers={controlPanelHandlers(props, own)} />
