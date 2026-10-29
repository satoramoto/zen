<script lang="ts">
import Tree from '../../../view/Tree.svelte';
import {plotViewportView,plotViewportHandlers,type PlotViewportProps} from './PlotViewport.model';
import '../../../primitives/Text.css';
import './PlotViewport.css';
let props:PlotViewportProps=$props();
</script>
<Tree tree={plotViewportView(props)} handlers={plotViewportHandlers(props)}/>
