<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { frameWaveformHandlers, frameWaveformView, type FrameWaveformProps } from './frames.model';
  import '../base.css';
  import './mixer.css';
  let props: FrameWaveformProps = $props();
</script>

<Tree tree={frameWaveformView(props)} handlers={frameWaveformHandlers(props)} />
