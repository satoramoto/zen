<script lang="ts">
import Tree from '../../../foundation/view/Tree.svelte';
import { distributionPlotHandlers, distributionPlotView, type DistributionPlotProps } from './DistributionPlot.model';
import '../../../primitives/Text/Text.css';
import './DistributionPlot.css';
let props: DistributionPlotProps = $props();
</script>
<Tree tree={distributionPlotView(props)} handlers={distributionPlotHandlers(props)} />
