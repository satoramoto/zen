// TimeChart as the DOM renderer draws it: the same tree and handlers as `TimeChart.tsx` and `TimeChart.svelte`.
import { domPart } from '../../../foundation/view/dom';
import type { DomFill } from '../../../foundation/view/Tree.dom';
import { TIME_CHART_IDLE, timeChartHandlers, timeChartView, type TimeChartModelProps } from './TimeChart.model';
import '../../../primitives/Text/Text.css';
import '../../../components/Segmented/Segmented.css';
import './TimeChart.css';

export const TimeChartDom = domPart<TimeChartModelProps & { emptySlot?: DomFill }>({ events: ['onSpan'], value: { prop: 'span', on: 'onSpan' } }, ({ emptySlot, ...props }, use) => {
  const state = use.state(TIME_CHART_IDLE);
  return { tree: timeChartView(props, state.get(), { empty: emptySlot !== undefined }), slots: { empty: emptySlot }, handlers: timeChartHandlers(props, state.get(), state.set) };
});
