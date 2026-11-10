import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../../storybook';
import { WaveGraph, type WaveData } from './WaveGraph';

/** y = A·sin(B(x − C)) + D: amplitude, period, phase shift and midline, each on a slider, with the midline and the brackets drawn. */
const meta = {
  title: 'Math/Trig/Components/Wave Graph',
  component: WaveGraph,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof WaveGraph>;
export default meta;
type Story = StoryObj<typeof meta>;

const valueOf = (el: HTMLElement) => Number(el.getAttribute('aria-valuenow'));

/** Press an arrow key on a focused slider until it reads `target` (each press waits for the re-render). */
async function stepTo(slider: HTMLElement, target: number) {
  slider.focus();
  for (let i = 0; i < 200; i++) {
    const v = valueOf(slider);
    if (Math.abs(v - target) < 1e-6) return;
    await userEvent.keyboard(v < target ? '{ArrowRight}' : '{ArrowLeft}');
    await waitFor(() => expect(valueOf(slider)).not.toBe(v));
  }
  throw new Error(`${slider.getAttribute('aria-label')} never reached ${target}`);
}

/** Halving the period: from 2π to π, the period bracket halves and twice as many whole waves fit. */
export const HalvePeriod: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plane = canvas.getByRole('img');
    expect(plane).toHaveAttribute('aria-label', expect.stringMatching(/\b2 full waves/));
    expect(canvas.getByText(/period = 2π/)).toBeInTheDocument();
    const period = canvas.getByRole('slider', { name: 'Period' });
    period.focus();
    // Each arrow is π/12: twelve presses take 2π down to π.
    for (let i = 0; i < 12; i++) {
      const v = valueOf(period);
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(valueOf(period)).toBeLessThan(v));
    }
    await waitFor(() => expect(Math.abs(valueOf(period) - Math.PI)).toBeLessThan(1e-9));
    await waitFor(() => expect(canvas.getByText(/^period = π$/)).toBeInTheDocument());
    expect(plane).toHaveAttribute('aria-label', expect.stringMatching(/\b4 full waves/));
    expect(canvas.getByText(/so 4 full waves fit/)).toBeInTheDocument();
  },
};

/** The generating circle: the point's height on the circle is the curve's y at the same x. */
export const WithCircle: Story = {
  args: { circle: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('slider', { name: 'Point on the wave' });
    const start = valueOf(handle);
    handle.focus();
    for (let i = 0; i < 3; i++) {
      const v = valueOf(handle);
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(valueOf(handle)).toBeGreaterThan(v));
    }
    expect(valueOf(handle)).toBeGreaterThan(start);
    const readouts = () => Object.fromEntries([...canvasElement.querySelectorAll('.zen-trig__readout')].map((r) => [r.children[0].textContent, r.children[1].textContent]));
    await waitFor(() => {
      const r = readouts();
      expect(r['Point height']).toBeDefined();
      expect(r['Point height']).toBe(r['Curve at x']);
      expect(r['Point height']).not.toBe('0.00');
    });
  },
};

/** Tangent: the curve breaks at its poles, drawn as dashed asymptotes. */
export const Tangent: Story = {
  args: { kind: 'tan' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole('img')).toHaveAttribute('aria-label', expect.stringMatching(/breaks at x = π, 3π/));
    expect(canvas.getByText(/asymptotes/)).toBeInTheDocument();
  },
};

/** Inverse mode: sine on its restricted domain, and arcsin its mirror image in y = x. */
export const Inverse: Story = {
  args: { inverse: true, kind: 'sin' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('arcsin')).toBeInTheDocument();
    expect(canvas.getByText(/domain −π\/2 to π\/2/)).toBeInTheDocument();
    expect(canvas.queryByRole('slider', { name: 'Period' })).toBeNull();
  },
};

/** Six tide readings over a day: height in metres against the hour (A 1.2 m, period 12.4 h, shift 3 h, midline 2 m, with a little noise). */
const TIDE: WaveData = {
  points: [
    { x: 0, y: 0.86 },
    { x: 4, y: 2.5 },
    { x: 8, y: 2.73 },
    { x: 12, y: 0.76 },
    { x: 16, y: 2.45 },
    { x: 20, y: 2.84 },
  ],
  band: 0.25,
  xLabel: 'hour',
  yLabel: 'm',
  domain: [0, 24],
  yRange: [0, 4],
};

/** Fitting tide data: from a poor start, set the four sliders until the curve passes within the band of every point. */
export const TideData: Story = {
  args: { data: TIDE, amplitude: 0.5, period: 8, shift: 0, midline: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/2 of 6 points within the band/)).toBeInTheDocument();
    // Data mode steps: 0.05 m for amplitude and midline, 0.2 h for period and shift.
    await stepTo(canvas.getByRole('slider', { name: 'Amplitude' }), 1.2);
    await stepTo(canvas.getByRole('slider', { name: 'Period' }), 12.4);
    await stepTo(canvas.getByRole('slider', { name: 'Phase shift' }), 3);
    await stepTo(canvas.getByRole('slider', { name: 'Midline' }), 2);
    await waitFor(() => expect(canvas.getByText(/Within the band at every point/)).toBeInTheDocument());
  },
};

/** The tide fitted: the values a reader lands on. */
export const TideDataFitted: Story = {
  args: { data: TIDE, amplitude: 1.2, period: 12.4, shift: 3, midline: 2 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/Within the band at every point/)).toBeInTheDocument();
  },
};

/** Matching a target: a dashed curve to reach by moving the sliders. */
export const Target: Story = {
  args: { target: { kind: 'sin', amplitude: 2, period: Math.PI, shift: Math.PI / 4, midline: 1 } },
};
