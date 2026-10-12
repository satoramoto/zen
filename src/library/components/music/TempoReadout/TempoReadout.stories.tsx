import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { TempoReadout } from './TempoReadout';

/**
 * The display's tempo block: the number in the readout face (drag it, scroll on it, or use the
 * arrow keys; double-click for the style's tempo), "BPM" as a small label on its baseline, and a
 * framed + over − at its right, two control-height keys, neutral until pressed.
 */
const meta = {
  title: 'Design OS/Components/Music/TempoReadout',
  component: TempoReadout,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { bpm: 104, onTempo: fn(), onPlus: fn(), onMinus: fn(), onReset: fn() },
  argTypes: {
    bpm: { control: { type: 'number', min: 5, max: 500, step: 1 } },
    unit: { control: 'text' },
    min: { control: { type: 'number', min: 5, max: 500, step: 1 } },
    max: { control: { type: 'number', min: 5, max: 500, step: 1 } },
    cells: { control: 'boolean' },
    unitLarge: { control: 'boolean' },
    size: { control: 'text' },
  },
} satisfies Meta<typeof TempoReadout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: 104 BPM. Dragging up 8px asks for 106; − held calls with `true`, released with `false`. */
export const Board: Story = {
  args: { bpm: 104, unit: 'BPM', min: 5, max: 500 },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    const number = c.getByRole('spinbutton');
    await fireEvent.pointerDown(number, { pointerId: 1, button: 0, clientY: 300 });
    await fireEvent.pointerMove(number, { pointerId: 1, clientY: 292 });
    await fireEvent.pointerUp(number, { pointerId: 1 });
    await expect(args.onTempo).toHaveBeenLastCalledWith(106);
    const minus = c.getByRole('button', { name: 'Tempo down (Function)' });
    await fireEvent.pointerDown(minus, { button: 0 });
    await fireEvent.pointerUp(minus);
    await expect(args.onMinus).toHaveBeenNthCalledWith(1, true);
    await expect(args.onMinus).toHaveBeenNthCalledWith(2, false);
  },
};

/** At the top of its range: ↑ asks for nothing more. */
export const AtMax: Story = {
  args: { bpm: 500, unit: 'BPM', min: 5, max: 500 },
  play: async ({ canvasElement, args }) => {
    await fireEvent.keyDown(within(canvasElement).getByRole('spinbutton'), { key: 'ArrowUp' });
    await expect(args.onTempo).not.toHaveBeenCalled();
  },
};

/** A two-digit tempo keeps the same width as 500, so the unit and keys don't move. */
export const Slow: Story = {
  args: { bpm: 68, unit: 'BPM', min: 5, max: 500 },
};

/** New: a hero-sized numeral by `size` (set as `--yh-tempo-readout-size`); + and − scale with it. */
export const HeroSize: Story = {
  args: { bpm: 104, unit: 'BPM', min: 5, max: 500, size: 'var(--size-display)' },
  play: async ({ canvasElement }) => {
    const tempo = canvasElement.querySelector<HTMLElement>('.yh-tempo-readout')!;
    await expect(tempo.style.getPropertyValue('--yh-tempo-readout-size')).toBe('var(--size-display)');
  },
};

/** In cells: it fills a 360 × 80 size container; the reading on its foot, + over − beside it. */
export const Cells: Story = {
  args: { bpm: 104, unit: 'BPM', min: 5, max: 500, cells: true },
  parameters: { sample: { width: 360, height: 80 } },
  render: (args) => (
    <div style={{ containerType: 'size', width: 360, height: 80 }}>
      <TempoReadout {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    const tempo = canvasElement.querySelector('[data-cells]') as HTMLElement;
    await expect(tempo).toHaveClass('yh-tempo-readout--cells');
    const plus = c.getByRole('button', { name: 'Tempo up (Scene Launch)' });
    c.getByRole('button', { name: 'Tempo down (Function)' });
    const whole = tempo.getBoundingClientRect();
    // Real layout only (jsdom has none): the keys stand on the container's foot, under half its height each.
    if (whole.height > 0) {
      const steps = plus.parentElement!.getBoundingClientRect();
      await expect(Math.abs(steps.bottom - whole.bottom)).toBeLessThan(1);
      await expect(plus.getBoundingClientRect().height).toBeLessThan(whole.height / 2);
    }
    await fireEvent.pointerDown(plus, { button: 0 });
    await fireEvent.pointerUp(plus);
    await expect(args.onPlus).toHaveBeenNthCalledWith(1, true);
    await expect(args.onPlus).toHaveBeenNthCalledWith(2, false);
  },
};

/** In cells with the unit set large, in the numeral's ink. */
export const CellsUnitLarge: Story = {
  ...Cells,
  args: { bpm: 104, unit: 'BPM', min: 5, max: 500, cells: true, unitLarge: true },
  play: undefined,
};
