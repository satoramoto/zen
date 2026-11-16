<!--
  TimeChart: the model's tree (`timeChartView`, TimeChart.model.ts) drawn by the Svelte `Tree`, as
  `TimeChart.tsx` draws it with the React one; see TimeChart.tsx for the job and the parts.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import Tree from '../../../foundation/view/Tree.svelte';
  import { viewState } from '../../../foundation/view/viewState';
  import { TIME_CHART_IDLE, timeChartHandlers, timeChartView, type TimeChartModelProps } from './TimeChart.model';
  import '../../../primitives/Text/Text.css';
  import '../../../components/Segmented/Segmented.css';
  import './TimeChart.css';

  interface Props extends TimeChartModelProps {
    emptySlot?: Snippet;
  }

  let { emptySlot, ...props }: Props = $props();
  const state = viewState(TIME_CHART_IDLE);
  const view = fromStore(state);
</script>

<Tree tree={timeChartView(props, view.current, { empty: emptySlot !== undefined })} slots={{ empty: emptySlot }} handlers={timeChartHandlers(props, view.current, state.set)} />
