<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { framePlayheadHandlers, framePlayheadView, type FramePlayheadProps } from './frames.model';
  import '../base.css';
  import './mixer.css';
  let props: FramePlayheadProps = $props();
</script>

<Tree tree={framePlayheadView(props)} handlers={framePlayheadHandlers(props)} />
