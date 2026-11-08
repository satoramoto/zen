import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { GapSpectrum } from './GapSpectrum';

/** The prime gaps played as tones: the spectrum's spikes are the gap sizes, as tall as the histogram's bars. */
const meta = {
  title: 'Math/Primes/Gap Spectrum',
  component: GapSpectrum,
  decorators: [withLibraryTheme],
  argTypes: {
    count: { control: { type: 'range', min: 2, max: 100_000, step: 1 } },
    signal: { control: 'inline-radio', options: ['gaps', 'indicator'] },
    chosen: { control: { type: 'range', min: 1, max: 40, step: 1 } },
  },
} satisfies Meta<typeof GapSpectrum>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The gaps of the first 10,000 primes: 6 is the tallest spike and the tallest bar (2,012 gaps); 2 has 1,270. */
export const GapsAsTones: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const drawing = await canvas.findByRole('img', { name: /Fourier-transformed/ });
    await waitFor(() => expect(drawing.getAttribute('aria-label')).toMatch(/tallest spikes are at 6,/));
    expect(within(drawing).getByText('gap 6: 2,012')).toBeInTheDocument();
    const gap = canvas.getByRole('slider', { name: /gap size/i });
    gap.focus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await waitFor(() => expect(within(drawing).getByText('gap 2: 1,270')).toBeInTheDocument());
    expect(drawing.querySelector('.zen-primes__bar--chosen')?.getAttribute('data-gap')).toBe('2');
  },
};

/** The prime indicator up to 2¹⁷ = 131,072: apart from zero, its peaks are at ½, then ⅓ and ⅙. */
export const Indicator: Story = {
  args: { signal: 'indicator' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const drawing = await canvas.findByRole('img', { name: /Fourier-transformed/ });
    for (const f of ['½', '⅓', '⅙']) expect(within(drawing).getByText(f)).toBeInTheDocument();
    expect(drawing.getAttribute('aria-label')).toMatch(/largest peaks are at ½, (⅓, ⅙|⅙, ⅓)/);
  },
};

/** Half a million primes asked for: the figure computes 100,000 and says so. */
export const Clamped: Story = {
  args: { count: 500_000 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(await canvas.findByText(/Limited to 100,000 primes/)).toBeInTheDocument();
  },
};
