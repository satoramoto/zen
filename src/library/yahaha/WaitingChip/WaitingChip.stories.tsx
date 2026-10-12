import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { WaitingChip, type WaitingHue } from './WaitingChip';

const meta = {
  title: 'Yahaha/Primitives/WaitingChip',
  component: WaitingChip,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    hue: { control: 'select', options: ['intro', 'main', 'ending', 'brk', 'fill', 'a', 't'] },
    size: { control: 'inline-radio', options: ['count', 'line', 'display'] },
  },
} satisfies Meta<typeof WaitingChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The count row's next section, Main: an arrow in the "next" role (`--accent`) before "Main C"; sections take no hue. */
export const Board: Story = {
  args: { label: 'Main C', hue: 'main', size: 'count' },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByText('Main C');
    await expect(chip).toHaveAttribute('data-face', 'waiting');
    await expect(chip).toHaveAttribute('data-hue', 'main');
    await expect(chip.style.getPropertyValue('--yh-waiting-chip-hue')).toBe('var(--accent)');
    await expect(chip).toHaveAttribute('data-size', 'count');
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
    await expect(canvasElement.querySelector('a[href], button, input, select, textarea, [tabindex]')).toBeNull();
  },
};

/** The next section on the display (`t`), in the display face, its arrow in `--accent` (next, by default). */
export const Display: Story = {
  args: { label: 'Main C', hue: 't', size: 'display' },
};

/** The style line's queued style, waiting for the bar line: an accent arrow before "Coastal Highway". */
export const QueuedStyle: Story = {
  args: { label: 'Coastal Highway', hue: 'a', size: 'line' },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByText('Coastal Highway');
    await expect(chip).toHaveAttribute('data-hue', 'a');
    await expect(chip).toHaveAttribute('data-size', 'line');
  },
};

/** Nothing waiting: an empty label draws nothing at all. */
export const Empty: Story = {
  args: { label: '', hue: 'main', size: 'count' },
  parameters: { rendersNothing: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-face]')).toBeNull();
  },
};

/** A long style name on the style line: capped and ended with "…"; the full name is still its text. */
export const LongStyle: Story = {
  args: { label: 'Coastal Highway Cruise Unplugged Ballad', hue: 'a', size: 'line' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Coastal Highway Cruise Unplugged Ballad')).toBeInTheDocument();
  },
};

const HUES: WaitingHue[] = ['intro', 'main', 'fill', 'brk', 'ending', 'a', 't'];
const NAMES: Record<WaitingHue, string> = {
  intro: 'Intro II',
  main: 'Main C',
  fill: 'Fill B',
  brk: 'Break',
  ending: 'Ending III',
  a: 'Coastal Highway',
  t: 'Main D',
};

/**
 * Every hue at the count size, to compare the arrows under each pack: every section and the
 * queued style share the "next" role; only `t` is neutral.
 */
export const AllHues: Story = {
  args: { label: 'Main C' },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
      {HUES.map((hue) => (
        <WaitingChip key={hue} label={NAMES[hue]} hue={hue} />
      ))}
    </div>
  ),
};
