import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { scenario } from 'story-spec';
import { withLibraryTheme } from '../../../storybook';
import { ThemeScope, resolveTheme } from '../../../theme';
import { fixtureStories, withRenderer } from '../../../foundation/stories/story';
import { TimeChart, type TimeChartProps } from './TimeChart';
import TimeChartSvelte from './TimeChart.svelte';
import { coins, timeChartStories as s, yieldSeries } from './TimeChart.fixtures';
import { DAY } from '../../model/series';

// Every story is built from TimeChart.fixtures.ts, which the tree snapshot shares; the toolbar's
// Renderer draws it with React's, Svelte's or the DOM renderer's `Tree`. The plot is a canvas, so
// the stories that look at it are tagged `browser`; the text (legend, summary, empty message, span
// switch) plays everywhere.

const meta = {
  title: 'Chart/Components/TimeChart',
  component: TimeChart,
  decorators: [withRenderer, withLibraryTheme],
  parameters: {
    layout: 'padded',
    spec: {
      capability: 'chart-time-chart',
      change: 'dashboard-charts',
      purpose: 'A chart of values over time that wears the pack it is drawn in, for dashboards: several series on one axis, a crosshair that reads them as text, and an accessible summary.',
    },
  },
  args: { onSpan: fn() },
} satisfies Meta<typeof TimeChart>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(TimeChart, TimeChartSvelte);

/** The pointer moved to a point of the page, on whatever is drawn there (the plot's pane canvas). */
const pointAt = (x: number, y: number) => userEvent.pointer({ target: document.elementFromPoint(x, y)!, coords: { clientX: x, clientY: y } });

const plotOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-part="plot"]')!;
const drawn = (root: HTMLElement) => waitFor(() => expect(plotOf(root).dataset.seriesColours).toBeTruthy(), { timeout: 8000 });
/** A contract variable as the page computes it, in the form the store writes. */
const computed = (root: HTMLElement, name: string) => {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  plotOf(root).append(probe);
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.fillStyle = getComputedStyle(probe).color;
  probe.remove();
  return String(ctx.fillStyle);
};

export const TwoSeriesInTheirHues: Story = {
  ...scenario(
  {
    name: 'Two series in their hues',
    requirement: 'Series on one time axis in the pack\'s colours',
    shall: 'A TimeChart SHALL draw each of its series on one time axis, series n in the pack\'s hue n, as a line, an area, a baseline or a histogram.',
    when: 'a TimeChart is drawn with two line series',
    then: 'each series is drawn, the first in hue 1 and the second in hue 2',
    check: async ({ canvasElement }) => {
      await drawn(canvasElement);
      const colours = plotOf(canvasElement).dataset.seriesColours!.split(' ');
      await expect(colours[0]).toBe(computed(canvasElement, '--hue-1'));
      await expect(colours[1]).toBe(computed(canvasElement, '--hue-2'));
      await expect(plotOf(canvasElement).querySelector('canvas')).not.toBeNull();
    },
  },
  story(s.Compare),
  ),
  tags: ['browser'],
};

export const AboveAndBelowTheBase: Story = {
  ...scenario(
  {
    name: 'Above and below the base',
    requirement: 'A baseline series shows which side of a value it is on',
    shall: 'A baseline series SHALL be drawn in the success colour above its base value and the danger colour below it.',
    when: 'a baseline series crosses its base value',
    then: 'the part above is drawn in success and the part below in danger',
    check: async ({ canvasElement }) => {
      await drawn(canvasElement);
      await expect(plotOf(canvasElement).dataset.seriesColours).toBe(`${computed(canvasElement, '--success')}/${computed(canvasElement, '--danger')}`);
      const key = canvasElement.querySelector('[data-kind="baseline"]');
      await expect(key).not.toBeNull();
    },
  },
  story(s.Measured),
  ),
  tags: ['browser'],
};

export const TwoCoinsFromOneStart: Story = {
  ...scenario(
  {
    name: 'Two coins from one start',
    requirement: 'Rebased to percent change',
    shall: 'With rebasing on, every series SHALL be drawn as its percent change from its own first point.',
    when: 'two series that start at different values are drawn rebased',
    then: 'both start at 0% and the readout gives each one\'s change in percent',
    act: async ({ canvasElement }) => {
      await drawn(canvasElement);
      const plot = plotOf(canvasElement);
      const box = plot.getBoundingClientRect();
      // The first reading of the span: the left edge of the plot area.
      await pointAt(box.left + 8, box.top + box.height / 2);
    },
    check: async ({ canvasElement }) => {
      const readout = canvasElement.querySelector<HTMLElement>('[data-part="readout"]')!;
      await waitFor(() => expect(readout).not.toHaveAttribute('hidden'));
      const values = [...readout.querySelectorAll('.lib-chart__reading > .lib-text')].map((b) => b.textContent);
      await expect(values).toHaveLength(3);
      for (const value of values) await expect(value).toMatch(/%|–/);
      await expect(canvasElement.querySelector('.lib-chart')).toHaveAttribute('data-rebased', 'true');
    },
  },
  story(s.Compare),
  ),
  tags: ['browser'],
};

export const ReadingAMoment: Story = {
  ...scenario(
  {
    name: 'Reading a moment',
    requirement: 'The crosshair reads every series as text',
    shall: 'Pointing at the chart SHALL show, as text, each series\' name and value at the time pointed at.',
    when: 'the pointer moves over the chart',
    then: 'the readout names that moment and lists each series\' value there',
    act: async ({ canvasElement }) => {
      await drawn(canvasElement);
      const plot = plotOf(canvasElement);
      const box = plot.getBoundingClientRect();
      await pointAt(box.left + box.width / 2, box.top + box.height / 2);
    },
    check: async ({ canvasElement }) => {
      const readout = canvasElement.querySelector<HTMLElement>('[data-part="readout"]')!;
      await waitFor(() => expect(readout).not.toHaveAttribute('hidden'));
      await expect(readout.querySelector('time')!.textContent).toMatch(/\d+ (Oct|Nov)/);
      await expect(readout).toHaveTextContent('KRX');
      await expect(readout.querySelector('.lib-chart__reading > .lib-text')!.textContent).toMatch(/USD \/ H\/s \/ day/);
    },
  },
  story(s.Yield),
  ),
  tags: ['browser'],
};

export const AScreenReadersView: Story = scenario(
  {
    name: 'A screen reader\'s view',
    requirement: 'An accessible summary',
    shall: 'The chart SHALL give, as text for assistive technology, each series\' last value and its change over the span.',
    when: 'a TimeChart is drawn',
    then: 'a summary lists each series with its last value and change',
    check: async ({ canvasElement }) => {
      const items = [...canvasElement.querySelectorAll('[data-part="summary"] li')].map((li) => li.textContent);
      await expect(items).toHaveLength(3);
      await expect(items[0]).toMatch(/^KRX: [+-−]?[\d.]+% over the span$/);
      await expect(within(canvasElement).getByRole('img').getAttribute('aria-label')).toContain('Yield per hash, change: KRX');
    },
  },
  story(s.Compare),
);

export const OneReadingSoFar: Story = scenario(
  {
    name: 'One reading so far',
    requirement: 'Too few points says so',
    shall: 'A chart whose series have fewer than two points SHALL show a message instead of an empty plot.',
    when: 'every series has fewer than two points',
    then: 'the chart shows its empty message and draws no plot',
    check: async ({ canvasElement }) => {
      await expect(canvasElement.querySelector('[data-part="empty"]')).toHaveTextContent('One reading so far');
      await expect(canvasElement.querySelector('[data-part="plot"]')).toBeNull();
    },
  },
  story(s.Empty),
);

/** The scope around the chart, in the mode a button switches: a theme change from outside the chart. */
function InAScope(props: TimeChartProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const { facets } = resolveTheme({ theme: 'market' });
  return (
    <div>
      <button type="button" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
        Turn {mode === 'light' ? 'dark' : 'light'}
      </button>
      <ThemeScope facets={facets} mode={mode}>
        <TimeChart {...props} />
      </ThemeScope>
    </div>
  );
}

export const TheSystemTurnsDark: Story = {
  ...scenario(
  {
    name: 'The system turns dark',
    requirement: 'Follows the theme',
    shall: 'A drawn chart SHALL take the new colours when its scope\'s pack or mode changes, without being redrawn by its host.',
    when: 'the scope around a drawn chart turns dark',
    then: 'the chart\'s scale text, grid and series take the dark colours',
    act: async ({ canvasElement }) => {
      await drawn(canvasElement);
      plotOf(canvasElement).dataset.light = plotOf(canvasElement).dataset.seriesColours;
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Turn dark' }));
    },
    check: async ({ canvasElement }) => {
      const plot = plotOf(canvasElement);
      await waitFor(() => expect(plot.dataset.seriesColours).not.toBe(plot.dataset.light));
      await expect(plot.dataset.seriesColours!.split(' ')[0]).toBe(computed(canvasElement, '--hue-1'));
    },
  },
  story(s.Compare, { render: (args) => <InAScope {...args} /> }),
  ),
  tags: ['browser'],
};

export const ABreakEvenLineAndAnEvent: Story = {
  ...scenario(
  {
    name: 'A break-even line and an event',
    requirement: 'Reference lines and markers',
    shall: 'A TimeChart SHALL draw each reference line it is given at its value with its label and tone, and each marker at its time on its series with its label and tone; a line outside the values in view SHALL be named in words with the side it lies on.',
    when: 'a chart is given a reference line and a marker',
    then: 'the line is drawn at its value with its label, and the marker on its series at its time',
    check: async ({ canvasElement }) => {
      await drawn(canvasElement);
      await expect(plotOf(canvasElement).dataset.decorations).toBe('1 lines, 1 markers');
    },
  },
  story(s.Yield, { args: { ...s.Yield.args, markers: [{ time: yieldSeries.points[90][0], label: 'Listed', tone: 'accent' }] } as never }),
  ),
  tags: ['browser'],
};

export const TheLastWeek: Story = scenario(
  {
    name: 'The last week',
    requirement: 'Spans window the points',
    shall: 'A TimeChart given spans SHALL show the points inside the chosen span from the points it already has, and rebase to the first point inside it.',
    when: 'the span is switched to one week',
    then: 'only the last week is in view and rebased series start at 0% at its first point',
    act: async ({ canvasElement }) => {
      canvasElement.dataset.all = canvasElement.querySelector('[data-part="summary"] li')!.textContent!;
      await userEvent.click(within(canvasElement).getByRole('radio', { name: '1W' }));
    },
    check: async ({ canvasElement, args }) => {
      await expect(args.onSpan).toHaveBeenLastCalledWith(1);
      await expect(within(canvasElement).getByRole('radio', { name: '1W' })).toHaveAttribute('aria-checked', 'true');
      const week = canvasElement.querySelector('[data-part="summary"] li')!.textContent!;
      await expect(week).not.toBe(canvasElement.dataset.all);
      const first = coins[0].points.find(([t]) => t >= coins[0].points.at(-1)![0] - 7 * DAY)![1];
      const last = coins[0].points.at(-1)![1];
      const change = new Intl.NumberFormat('en-US', { style: 'percent', maximumSignificantDigits: 2, signDisplay: 'exceptZero' }).format(last / first - 1);
      await expect(week).toContain(change);
    },
  },
  story(s.Compare),
);

export const ACoinsLineLinksToItsPage: Story = scenario(
  {
    name: 'A coin\'s line links to its page',
    requirement: 'A legend of the series',
    shall: 'A TimeChart SHALL list each series in a legend with its name, its latest value and its change (rebased, its change alone), and a series given a link SHALL link from its name.',
    when: 'a series has a link',
    then: 'its legend name is a link to it',
    check: async ({ canvasElement }) => {
      const link = within(canvasElement).getByRole('link', { name: 'KRX' });
      await expect(link).toHaveAttribute('href', '#coin-krx');
      const key = link.closest('[data-series]')!;
      // Rebased, each series reads as its change alone: its raw value means nothing on a shared percent scale.
      await expect(key.querySelector('.lib-chart__last')).toBeNull();
      await expect(key.querySelector('[data-direction]')!.textContent).toMatch(/%/);
    },
  },
  story(s.Compare),
);

export const ABreakEvenOffTheScale: Story = scenario(
  {
    name: 'A break-even off the scale',
    requirement: 'Reference lines and markers',
    when: 'a reference line lies outside the values in view',
    then: 'the chart says in words that it is below or above, with its label and value',
    check: async ({ canvasElement }) => {
      const ref = canvasElement.querySelector('[data-part="offscale"] li')!;
      await expect(ref).toHaveAttribute('data-side', 'below');
      await expect(ref).toHaveTextContent('↓ Break-even at 2× 0.0000004 USD / H/s / day, below the chart');
    },
  },
  story(s.FarAbove),
);

/** Runs a day as bars, no legend, short. */
export const Bars: Story = story(s.Bars);
