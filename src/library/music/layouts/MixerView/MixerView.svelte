<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { mixerModel } from './MixerView.model';
  import type { MixerViewProps } from '../../components/mixer.model';
  import '../../base.css';
  import '../../components/mixer.css';
  let props: MixerViewProps = $props();
  const model = $derived(mixerModel(props));
</script>

<Tree tree={model.tree} handlers={model.handlers} />
