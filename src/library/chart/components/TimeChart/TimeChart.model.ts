// TimeChart's model: the tree every renderer draws, framework-free. The plot is an element bound to
// the `timeChart` store (Lightweight Charts, `TimeChart.plot.ts`); everything a person reads is text in
// the tree: the legend (each series' name, latest value and change, a link when it has one), the
// span switch, the readout of the moment the pointer is at, and a summary for assistive
// technology. With too few readings it says so instead of drawing an empty plot.
import { component, each, h, slot, styleText, when, wire, type Handlers, type Node } from '../../../foundation/view/Tree.model';
import { textNode } from '../../../primitives/Text/Text.model';
import type { TextTone } from '../../../primitives/Text/Text.model';
import {
  DEFAULT_SPANS,
  direction,
  drawable,
  formatChange,
  formatTime,
  formatValue,
  lastChange,
  lineSide,
  prepared,
  spanStart,
  valueAt,
  type ChartLine,
  type ChartMarker,
  type ChartSeries,
  type ChartSpan,
  type ValueFormat,
} from '../../model/series';

export interface TimeChartModelProps {
  series: readonly ChartSeries[];
  /** Draw every series as its percent change from its first reading in the span. */
  rebase?: boolean;
  lines?: readonly ChartLine[];
  markers?: readonly ChartMarker[];
  /** How values read (rebased series read as percent). */
  format?: ValueFormat;
  /** The spans offered (`false`: none). Default a day, a week, a month and all of it. */
  spans?: readonly ChartSpan[] | false;
  /** The chosen span, by position; leave it out and the chart keeps its own, starting on the last. */
  span?: number;
  onSpan?(index: number): void;
  /** In px. Default 240. */
  height?: number;
  /** The chart's accessible name. */
  label?: string;
  /** What it says with too few readings (an `empty` slot takes its place). */
  empty?: string;
  /** Default true. */
  legend?: boolean;
}

/** The view state the store and the span switch set. */
export interface TimeChartState {
  hover: number | null;
  span: number | null;
}

export const TIME_CHART_IDLE: TimeChartState = { hover: null, span: null };

const spansOf = (props: TimeChartModelProps): readonly ChartSpan[] => (props.spans === false ? [] : (props.spans ?? DEFAULT_SPANS));

/** The span in force: the host's, else the chart's own, else the last offered. */
export function chosenSpan(props: TimeChartModelProps, state: TimeChartState): { index: number; span: ChartSpan | undefined } {
  const spans = spansOf(props);
  const index = props.span ?? state.span ?? spans.length - 1;
  return { index, span: spans[index] };
}

/** A label-sized line of body text (the legend's, the readout's). */
const small = (props: Parameters<typeof textNode>[0], ...children: (Node | string)[]) => textNode({ role: 'body', size: 'label', ...props }, {}, ...children);
const toneOf = (d: 'up' | 'down' | 'flat'): TextTone => (d === 'up' ? 'success' : d === 'down' ? 'danger' : 'muted');

export function timeChartView(props: TimeChartModelProps, state: TimeChartState = TIME_CHART_IDLE, slots: { empty?: boolean } = {}): Node {
  const { series, rebase = false, lines, markers, format = {}, height = 240, label, empty = 'Not enough readings to draw yet.', legend = true } = props;
  const spans = spansOf(props);
  const { index, span } = chosenSpan(props, state);
  const start = spanStart(series, span);
  const ok = drawable(series, start);
  const read = (value: number | null) => formatValue(value, format);
  const summary = series.map((s) => {
    const { last, change } = lastChange(s.points, start);
    return { name: s.name, last: read(last), change: formatChange(change), direction: direction(change) };
  });
  // Rebased, a series reads as its change: its raw last value says nothing on a shared percent scale.
  const sentence = summary.map((s) => (rebase ? `${s.name} ${s.change}` : `${s.name} ${s.last}, ${s.change}`)).join('; ');
  const offscale = (lines ?? []).flatMap((line) => {
    const side = rebase ? 'inside' : lineSide(series, line.value, rebase, start);
    return side === 'inside' ? [] : [{ ...line, side }];
  });
  const hovered = state.hover;

  return h(
    'div',
    { class: 'lib-chart', 'data-part': 'root', role: 'group', 'aria-label': label, 'data-rebased': rebase ? 'true' : undefined },
    when(legend || spans.length > 0, () =>
      h(
        'div',
        { class: 'lib-chart__head', 'data-part': 'head' },
        when(legend, () =>
          h(
            'ul',
            { class: 'lib-chart__legend', 'data-part': 'legend' },
            each(
              series as ChartSeries[],
              (s) => s.name,
              (s, i) =>
                h(
                  'li',
                  { class: 'lib-chart__key', 'data-series': String((i % 5) + 1), 'data-kind': s.kind ?? 'line' },
                  h('i', { class: 'lib-chart__swatch', 'aria-hidden': 'true' }),
                  s.href
                    ? h('a', { class: 'lib-chart__name', href: s.href }, small({ weight: 'strong' }, s.name))
                    : small({ weight: 'strong', className: 'lib-chart__name' }, s.name),
                  when(!rebase, () => small({ tone: 'secondary', tabular: true, className: 'lib-chart__last' }, summary[i].last)),
                  h('span', { class: 'lib-chart__change', 'data-direction': summary[i].direction }, small({ tone: toneOf(summary[i].direction), tabular: true }, summary[i].change)),
                ),
            ),
          ),
        ),
        when(ok && offscale.length > 0, () =>
          h(
            'ul',
            { class: 'lib-chart__offscale', 'data-part': 'offscale' },
            each(
              offscale,
              (line) => `${line.label ?? ''}${line.value}`,
              (line) =>
                h(
                  'li',
                  { class: 'lib-chart__ref', 'data-side': line.side, 'data-tone': line.tone ?? 'accent' },
                  small({ tone: 'muted' }, `${line.side === 'above' ? '↑' : '↓'} ${line.label ? `${line.label} ` : ''}${read(line.value)}, ${line.side} the chart`),
                ),
            ),
          ),
        ),
        when(spans.length > 0 && ok, () =>
          component('Segmented', { items: spans.map((s) => s.label), index, label: 'Span' }, { on: { onChange: 'span' } }),
        ),
      ),
    ),
    ok
      ? wire(
          h('div', {
            class: 'lib-chart__plot',
            'data-part': 'plot',
            role: 'img',
            'aria-label': label ? `${label}: ${sentence}` : sentence,
            style: styleText({ '--lib-chart-h': String(height) }),
          }),
          { bind: [['timeChart', { series, rebase, span, lines, markers, format, height, onHover: 'hover' }]] },
        )
      : textNode({ role: 'body', size: 'label', tone: 'muted', as: 'p', className: 'lib-chart__empty' }, { 'data-part': 'empty' }, slots.empty ? slot('empty') : empty),
    when(ok, () =>
      h(
        'div',
        { class: 'lib-chart__readout', 'data-part': 'readout', 'aria-hidden': 'true', hidden: hovered === null ? '' : undefined },
        small({ tone: 'muted', tabular: true, as: 'time', className: 'lib-chart__time' }, hovered === null ? '' : formatTime(hovered, span?.ms ?? null)),
        each(
          series as ChartSeries[],
          (s) => s.name,
          (s, i) => {
            const value = hovered === null ? null : valueAt(prepared(s, rebase, start), hovered);
            return small(
              { tone: 'secondary', tabular: true, className: 'lib-chart__reading' },
              `${s.name} `,
              small({ weight: 'strong', tabular: true, tone: (s.kind === 'baseline' ? 'primary' : (i % 5) + 1) as TextTone }, rebase ? formatChange(value) : read(value)),
            );
          },
        ),
      ),
    ),
    h(
      'ul',
      { class: 'lib-chart__summary', 'data-part': 'summary' },
      each(summary, (s) => s.name, (s) => h('li', {}, rebase ? `${s.name}: ${s.change} over the span` : `${s.name}: ${s.last}, ${s.change} over the span`)),
    ),
  );
}

export function timeChartHandlers(props: TimeChartModelProps, state: TimeChartState, setState: (next: TimeChartState) => void): Handlers {
  return {
    hover: (time: number | null) => {
      if (time !== state.hover) setState({ ...state, hover: time });
    },
    span: (index: number) => {
      if (props.span === undefined) setState({ ...state, span: index, hover: null });
      props.onSpan?.(index);
    },
  };
}
