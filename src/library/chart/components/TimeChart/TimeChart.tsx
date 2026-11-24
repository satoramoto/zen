import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { Tree } from '../../../foundation/view/Tree';
import { viewState } from '../../../foundation/view/viewState';
import { TIME_CHART_IDLE, timeChartHandlers, timeChartView, type TimeChartModelProps } from './TimeChart.model';
import '../../../primitives/Text/Text.css';
import '../../../components/Segmented/Segmented.css';
import './TimeChart.css';

export type { TimeChartModelProps, TimeChartState } from './TimeChart.model';

export interface TimeChartProps extends TimeChartModelProps {
  /** In place of the empty message, with too few readings. */
  emptySlot?: ReactNode;
}

/**
 * **Job.** Shows how values move over time, in the pack's colours: several series on one time
 * axis, as lines, areas, a baseline (success above its base, danger below) or a histogram, with
 * reference lines and event markers, optionally rebased to percent change from the first reading
 * in the chosen span.
 *
 * **Reads as text.** The legend names each series with its latest value and change (a link where
 * it has one); pointing at the plot reads every series at that moment; a summary gives assistive
 * technology the same. The plot is Lightweight Charts (`TimeChart.plot.ts`), loaded when a chart first
 * mounts, and restyled when its scope's pack or mode changes.
 *
 * **Parts.** `root`, `head`, `legend` (`key` per series, `data-series` 1–5, `swatch`, `name`, `last`,
 * `change` with `data-direction`), the span `Segmented`, `plot` (`data-chart`: loading, drawn,
 * unavailable), `readout`, `summary`, `empty`.
 */
export function TimeChart({ emptySlot, ...props }: TimeChartProps) {
  const [state] = useState(() => viewState(TIME_CHART_IDLE));
  const view = useSyncExternalStore(state.subscribe, state.get);
  return <Tree tree={timeChartView(props, view, { empty: emptySlot !== undefined })} slots={{ empty: emptySlot }} handlers={timeChartHandlers(props, view, state.set)} />;
}

export default TimeChart;
