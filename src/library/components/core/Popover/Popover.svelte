<!--
  Popover: the model's tree (`popoverView`, Popover.model.ts) drawn by the Svelte `Tree`, as
  `Popover.tsx` draws it with the React one; see Popover.tsx for the job. Placement and dismissal
  are the `popover` store (`placement.ts`), `portal` the `portal` store (`portal.ts`); a hover half
  comes from `createHoverIntent()` (`hoverIntent.ts`). `anchor` is a bound element, a `{ current }`
  ref or a box; the panel's controls are fields again (the control context).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../../view/Tree.svelte';
  import { CONTROL_FIELD, setControlContext } from '../../../primitives/control.svelte';
  import { popoverHandlers, popoverView, type PopoverBindingProps } from './Popover.model';
  import '../../../primitives/Text.css';
  import '../../../primitives/Surface.css';
  import './Popover.css';

  interface Props extends PopoverBindingProps {
    children?: Snippet;
  }

  let { children, ...props }: Props = $props();

  // A popover is a new surface: controls in it are fields again, even when it opens from a toolbar.
  setControlContext(CONTROL_FIELD);
</script>

<Tree tree={popoverView({ ...props, hover: props.hover !== undefined })} slots={{ children }} handlers={popoverHandlers(props)} />
