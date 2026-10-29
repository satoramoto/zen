<script lang="ts">
import Tree from '../../../view/Tree.svelte';
import { distributionPlotHandlers, distributionPlotView, type DistributionPlotProps } from './DistributionPlot.model';
import '../../../primitives/Text.css';
import './DistributionPlot.css';
let props: DistributionPlotProps = $props();
</script>
<Tree tree={distributionPlotView(props)} handlers={distributionPlotHandlers(props)} />
