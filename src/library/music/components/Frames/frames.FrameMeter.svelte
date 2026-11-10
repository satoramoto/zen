<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { frameMeterHandlers, frameMeterView, type FrameMeterProps } from './frames.model';
  import '../../base.css';
  import '../Meter/Meter.css';
  import '../mixer.css';
  let props: FrameMeterProps = $props();
</script>

<Tree tree={frameMeterView(props)} handlers={frameMeterHandlers(props)} />
