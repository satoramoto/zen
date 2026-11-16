// The chart area's entry: TimeChart (a time-series chart on Lightweight Charts, in the pack's
// colours) and the series model it reads. The package root and `svelte.ts` re-export it.
export { TimeChart, type TimeChartProps, type TimeChartModelProps, type TimeChartState } from './components/TimeChart/TimeChart';
export { timeChartView, timeChartHandlers } from './components/TimeChart/TimeChart.model';
export {
  DEFAULT_SPANS,
  formatValue,
  formatChange,
  formatTime,
  rebase,
  valueAt as seriesValueAt,
  lastChange,
  type ChartSeries,
  type ChartLine,
  type ChartMarker,
  type ChartSpan,
  type ChartTone,
  type Point,
  type SeriesKind,
  type ValueFormat,
} from './model/series';
