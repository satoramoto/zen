<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { mixerModel } from './MixerView.model';
  import type { MixerViewProps } from './model';
  import '../base.css';
  import './mixer.css';
  let props: MixerViewProps = $props();
  const model = $derived(mixerModel(props));
</script>

<Tree tree={model.tree} handlers={model.handlers} />
