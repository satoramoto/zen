<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { seekBarHandlers, seekBarView, type SeekBarProps } from './SeekBar.model';
  import './SeekBar.css';
  let props: SeekBarProps = $props();
</script>
<Tree tree={seekBarView(props)} handlers={seekBarHandlers(props)} />
