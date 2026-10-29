<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { meterView, type MeterProps } from './Meter.model';
  import '../base.css';
  import './Meter.css';
  let props: MeterProps = $props();
</script>

<Tree tree={meterView(props)} />
