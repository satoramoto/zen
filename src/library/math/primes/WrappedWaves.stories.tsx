import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { WrappedWaves } from './WrappedWaves';

/** Each prime's wave wrapped round a circle: a few as curves, thousands as a shaded disc. */
const meta = {
  title: 'Math/Primes/Wrapped Waves',
  component: WrappedWaves,
  decorators: [withLibraryTheme],
  args: {},
} satisfies Meta<typeof WrappedWaves>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The first four primes, 2, 3, 5 and 7, each a closed curve with p bumps. */
export const FewCurves: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const drawing = canvas.getByRole('img', { name: /^4 primes \(2, 3, 5, 7\) as curves/ });
    expect(drawing.querySelectorAll('path')).toHaveLength(4);
  },
};

/** Up to 20,000 primes by keyboard: the curves turn into a disc shaded by how many pass each spot. */
export const ToADisc: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: /primes/i });
    slider.focus();
    // Shift jumps three rungs of the ladder: ten jumps go from 4 to 20,000.
    await userEvent.keyboard('{Shift>}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{/Shift}');
    await waitFor(
      () => {
        expect(canvas.getByRole('img', { name: /20,000 waves/ })).toBeInTheDocument();
        expect(canvasElement.querySelector('.zen-primes__caption')?.textContent).not.toMatch(/Drawing/);
      },
      { timeout: 8000 },
    );
    const disc = canvas.getByRole('img', { name: /20,000 waves/ });
    expect(disc.tagName).toBe('CANVAS');
    expect(disc.getAttribute('aria-label')).not.toMatch(/still drawing/);
    expect(canvasElement.querySelector('svg.zen-primes__svg')).toBeNull();
  },
};

/** Asked for 500,000, the figure draws its limit of 100,000 and says so. */
export const Clamped: Story = {
  args: { count: 500000 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvasElement.querySelector('.zen-primes__caption')?.textContent).toMatch(/at most 100,000 waves/);
    expect(canvas.getByRole('img', { name: /100,000 waves/ })).toBeInTheDocument();
  },
};
