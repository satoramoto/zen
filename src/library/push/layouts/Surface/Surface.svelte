<!--
  Surface: the model's tree (`surfaceView`, Surface.model.ts) drawn by the Svelte `Tree`, as
  `Surface.tsx` draws it with the React one; see Surface.tsx for the job, the layout and the input.
-->
<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { surfaceHandlers, surfaceView, type SurfaceModelProps } from './Surface.model';
  import './Surface.css';

  let props: SurfaceModelProps = $props();
</script>

<Tree tree={surfaceView(props)} handlers={surfaceHandlers(props)} />
