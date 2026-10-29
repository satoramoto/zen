<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { waveformView, type WaveformProps } from './Waveform.model';
  import '../base.css';
  import './Waveform.css';

  // Keep className for mirrored source consumers; accept Svelte's class as well.
  let { class: klass, className, ...props }: WaveformProps & { class?: string } = $props();
</script>

<Tree tree={waveformView({ ...props, className: className ?? klass })} />
