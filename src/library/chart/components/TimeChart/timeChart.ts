// TimeChart's plot: Lightweight Charts drawn into the element a TimeChart's tree binds as
// `timeChart`, framework-free, so all three renderers apply the same store. Lightweight Charts is
// imported the first time a plot mounts (`import('lightweight-charts')`), so a page with no chart
// never loads it. It colours with literal values, so the store reads the pack's contract variables
// where the plot sits, normalises them through a canvas, and reapplies them when the scope around
// it changes (a pack, a mode). The tree keeps every word a person reads (legend, readout, summary);
// the plot draws, and reports the moment the pointer is at through `onHover`.
import { prepared, spanStart, type ChartLine, type ChartMarker, type ChartSeries, type ChartSpan, type ChartTone, type ValueFormat, formatValue } from '../../model/series';

export interface TimeChartParams {
  series: readonly ChartSeries[];
  rebase?: boolean;
  span?: ChartSpan;
  lines?: readonly ChartLine[];
  markers?: readonly ChartMarker[];
  format?: ValueFormat;
  /** The plot's height in px, and its size when the box can't be measured. */
  height: number;
  /** The moment the pointer is at, in epoch ms, or null when it leaves. */
  onHover?: (time: number | null) => void;
}

type Lib = typeof import('lightweight-charts');
type Chart = ReturnType<Lib['createChart']>;
type Api = ReturnType<Chart['addSeries']>;

const TONE_VAR: Record<ChartTone, string> = {
  good: '--success',
  close: '--warning',
  short: '--text-3',
  bad: '--danger',
  accent: '--accent',
  none: '--text-2',
};

let ctx: CanvasRenderingContext2D | null | undefined;
/** Whether a 2D canvas can be had here (jsdom has none). */
function canvas(): CanvasRenderingContext2D | null {
  if (ctx !== undefined) return ctx;
  try {
    ctx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Any CSS colour (a variable, `oklch()`, `color-mix()`), as resolved at `probe`, in the form
 *  Lightweight Charts parses: a canvas normalises it to hex, or to its rgb-with-alpha form. */
function resolve(probe: HTMLElement, css: string): string {
  probe.style.color = 'gray';
  probe.style.color = css;
  const computed = getComputedStyle(probe).color;
  const c = canvas();
  if (!c) return 'gray';
  c.fillStyle = 'gray';
  c.fillStyle = computed;
  return String(c.fillStyle);
}

const seconds = (ms: number) => Math.round(ms / 1000) as never;

/** Draws the chart into `node`. */
export function bindTimeChart(node: HTMLElement, initial: TimeChartParams) {
  let params = initial;
  let destroyed = false;
  let chart: Chart | null = null;
  let lib: Lib | null = null;
  let drawn: Api[] = [];
  let priceLines: { remove(): void }[] = [];
  let markerPlugins: { detach(): void }[] = [];
  let dataKey = '';
  const probe = document.createElement('span');
  probe.hidden = true;

  const palette = () => {
    if (!probe.isConnected) node.append(probe);
    const colour = (v: string) => resolve(probe, `var(${v}, gray)`);
    return {
      fade: (c: string, alpha: number) => resolve(probe, `color-mix(in srgb, ${c} ${Math.round(alpha * 100)}%, transparent)`),
      series: [1, 2, 3, 4, 5].map((n) => colour(`--hue-${n}`)),
      success: colour('--success'),
      danger: colour('--danger'),
      text: colour('--text-3'),
      grid: colour('--border'),
      crosshair: colour('--accent'),
      tone: (tone: ChartTone = 'accent') => colour(TONE_VAR[tone]),
      font: getComputedStyle(node).getPropertyValue('--font-sans').trim() || 'system-ui, sans-serif',
    };
  };

  const formatter = () => {
    const format: ValueFormat = params.rebase ? { style: 'percent', digits: params.format?.digits ?? 3 } : { ...params.format, unit: undefined };
    return (value: number) => formatValue(value, format);
  };

  /** The chart's look and every series' colours, from the pack where the plot sits. */
  const style = () => {
    if (!chart || !lib) return;
    const p = palette();
    chart.applyOptions({
      layout: { background: { type: lib.ColorType.Solid, color: 'transparent' }, textColor: p.text, fontFamily: p.font, attributionLogo: true },
      grid: { vertLines: { color: p.fade(p.grid, 0.6) }, horzLines: { color: p.fade(p.grid, 0.6) } },
      crosshair: { vertLine: { color: p.crosshair, labelBackgroundColor: p.crosshair }, horzLine: { color: p.crosshair, labelBackgroundColor: p.crosshair } },
      rightPriceScale: { borderColor: p.grid },
      timeScale: { borderColor: p.grid },
    });
    params.series.forEach((s, i) => {
      const api = drawn[i];
      if (!api) return;
      const hue = p.series[i % p.series.length];
      const kind = s.kind ?? 'line';
      if (kind === 'area') api.applyOptions({ lineColor: hue, topColor: p.fade(hue, 0.35), bottomColor: p.fade(hue, 0.02) } as never);
      else if (kind === 'baseline')
        api.applyOptions({
          topLineColor: p.success,
          topFillColor1: p.fade(p.success, 0.28),
          topFillColor2: p.fade(p.success, 0.04),
          bottomLineColor: p.danger,
          bottomFillColor1: p.fade(p.danger, 0.04),
          bottomFillColor2: p.fade(p.danger, 0.28),
        } as never);
      else if (kind === 'histogram') api.applyOptions({ color: hue } as never);
      else api.applyOptions({ color: hue } as never);
    });
    node.dataset.seriesColours = params.series.map((s, i) => ((s.kind ?? 'line') === 'baseline' ? `${p.success}/${p.danger}` : p.series[i % 5])).join(' ');
    drawDecorations(p);
  };

  /** Reference lines and markers, in their tones. */
  const drawDecorations = (p: ReturnType<typeof palette>) => {
    if (!lib) return;
    for (const line of priceLines) line.remove();
    for (const plugin of markerPlugins) plugin.detach();
    priceLines = [];
    markerPlugins = [];
    for (const line of params.lines ?? []) {
      const api = drawn[line.series ?? 0];
      if (!api) continue;
      const value = params.rebase ? null : line.value;
      if (value === null) continue;
      const handle = api.createPriceLine({ price: value, color: p.tone(line.tone), lineWidth: 1, lineStyle: lib.LineStyle.Dashed, axisLabelVisible: true, title: line.label ?? '' });
      priceLines.push({ remove: () => api.removePriceLine(handle) });
    }
    const bySeries = new Map<number, ChartMarker[]>();
    for (const m of params.markers ?? []) bySeries.set(m.series ?? 0, [...(bySeries.get(m.series ?? 0) ?? []), m]);
    for (const [index, markers] of bySeries) {
      const api = drawn[index];
      if (!api) continue;
      const plugin = lib.createSeriesMarkers(
        api,
        [...markers].sort((a, b) => a.time - b.time).map((m) => ({ time: seconds(m.time), position: 'aboveBar', shape: 'circle', color: p.tone(m.tone), text: m.label ?? '' })) as never,
      );
      markerPlugins.push(plugin as unknown as { detach(): void });
    }
    node.dataset.decorations = `${priceLines.length} lines, ${(params.markers ?? []).filter((m) => drawn[m.series ?? 0]).length} markers`;
  };

  /** The data, again only when the series, the span or what is drawn on them changed. */
  const data = () => {
    if (!chart || !lib) return;
    const key = JSON.stringify([params.series, params.rebase, params.span, params.lines, params.markers, params.format]);
    if (key === dataKey) return;
    dataKey = key;
    for (const api of drawn) chart.removeSeries(api);
    drawn = [];
    const start = spanStart(params.series, params.span);
    for (const s of params.series) {
      const kind = s.kind ?? 'line';
      const points = prepared(s, Boolean(params.rebase), start);
      // Values as small as 0.0000027 need a step to match, or the scale rounds every tick to one.
      const span = points.reduce((m, [, v]) => Math.max(m, Math.abs(v)), 0) || 1;
      const minMove = 10 ** (Math.floor(Math.log10(span)) - 4);
      const common = { lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: true, priceFormat: { type: 'custom' as const, formatter: formatter(), minMove } };
      const api =
        kind === 'area'
          ? chart.addSeries(lib.AreaSeries, { ...common, lineType: lib.LineType.Simple, pointMarkersVisible: Boolean(s.marks) })
          : kind === 'baseline'
            ? chart.addSeries(lib.BaselineSeries, { ...common, lineType: lib.LineType.Simple, pointMarkersVisible: Boolean(s.marks), baseValue: { type: 'price', price: params.rebase ? 0 : (s.base ?? s.points[0]?.[1] ?? 0) } })
            : kind === 'histogram'
              ? chart.addSeries(lib.HistogramSeries, { ...common })
              : chart.addSeries(lib.LineSeries, { ...common, lineWidth: 2, lineType: lib.LineType.Simple, pointMarkersVisible: Boolean(s.marks) });
      api.setData(points.map(([t, value]) => ({ time: seconds(t), value })) as never);
      drawn.push(api);
    }
    style();
    const last = Math.max(...params.series.flatMap((s) => s.points.map(([t]) => t)));
    // A little room after the last reading, so the last time label isn't clipped at the edge.
    if (start !== null && Number.isFinite(last)) chart.timeScale().setVisibleRange({ from: seconds(start), to: seconds(last + (last - start) * 0.04) });
    else chart.timeScale().fitContent();
  };

  const hover = (event: { time?: unknown }) => {
    params.onHover?.(typeof event.time === 'number' ? event.time * 1000 : null);
  };

  // The scope around the plot: a new pack or mode restyles it.
  const scope = node.closest('.lib-scope');
  const watching = scope ? new MutationObserver(() => style()) : null;
  watching?.observe(scope!, { attributes: true, attributeFilter: ['style', 'class', 'data-mode', 'data-zen-pack'] });
  const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const scheme = () => style();
  media?.addEventListener?.('change', scheme);

  if (!canvas()) node.dataset.chart = 'unavailable';
  else {
    node.dataset.chart = 'loading';
    import('lightweight-charts')
      .then((loaded) => {
        if (destroyed) return;
        lib = loaded;
        const measured = typeof ResizeObserver !== 'undefined';
        chart = loaded.createChart(node, { autoSize: measured, ...(measured ? {} : { width: node.clientWidth || 600, height: params.height }), handleScale: { axisPressedMouseMove: true }, rightPriceScale: { scaleMargins: { top: 0.12, bottom: 0.08 } }, timeScale: { timeVisible: true, secondsVisible: false, rightOffset: 3 } });
        chart.subscribeCrosshairMove(hover);
        node.dataset.chart = 'drawn';
        data();
      })
      .catch((error: unknown) => {
        if (destroyed) return;
        node.dataset.chart = 'unavailable';
        console.warn('zen TimeChart: could not load lightweight-charts (in a Rails app, pin it: see zen docs/rails.md)', error);
      });
  }

  return {
    update(next: TimeChartParams) {
      params = next;
      if (chart) data();
    },
    destroy() {
      destroyed = true;
      watching?.disconnect();
      media?.removeEventListener?.('change', scheme);
      chart?.unsubscribeCrosshairMove(hover);
      chart?.remove();
      chart = null;
      probe.remove();
      delete node.dataset.chart;
      delete node.dataset.seriesColours;
      delete node.dataset.decorations;
    },
  };
}
