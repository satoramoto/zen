<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../view/Tree.svelte';
  import { waveControlsHandlers, waveControlsView, type WaveControlsProps } from './WaveControls.model';
  import '../base.css';
  import './mixer.css';
  let { children, ...props }: WaveControlsProps & { children?: Snippet } = $props();
</script>

<Tree tree={waveControlsView(props)} handlers={waveControlsHandlers(props)} slots={{ children }} />
