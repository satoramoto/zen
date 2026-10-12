import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { AccentBlock } from './AccentBlock';

const meta = {
  title: 'Yahaha/Primitives/AccentBlock',
  component: AccentBlock,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { label: 'Sunday Drive Pop', onPress: fn(), tipAction: fn() },
  argTypes: {
    label: { control: 'text' },
    empty: { control: 'text' },
    as: { control: 'inline-radio', options: ['span', 'button'] },
    size: { control: 'inline-radio', options: ['line', 'knob'] },
    width: { control: 'number' },
    name: { control: 'text' },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof AccentBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The style name: the accent-barred block with a chevron; a click opens the Browser. */
export const Board: Story = {
  args: {
    label: 'Sunday Drive Pop',
    as: 'button',
    size: 'line',
    name: 'Sunday Drive Pop: open the Browser',
    empty: 'No style',
    tip: 'browser.open',
  },
};

const LONG_NAME = 'Bossa Nova Lounge Session With Strings And Brushes Deluxe 2';

/** A 59-character style name in a 240px block: one line, clipped with "…"; the full name stays in the button's name. */
export const LongName: Story = {
  args: { label: LONG_NAME, as: 'button', width: 240, name: `${LONG_NAME}: open the Browser` },
};

/** An empty label: the block shows its `empty` text ("No style") so it keeps its height and something to click. */
export const Empty: Story = {
  args: { label: '', as: 'button', empty: 'No style' },
};

/** New: between ‹ and › step keys, as the Display's header draws it: no chevron, so the line has two arrows, not three. */
export const BetweenSteps: Story = {
  args: { as: 'button', name: 'Sunday Drive Pop: open the Browser', chevron: false },
};

/** The knob page's name over the knobs: the plain label at the knob size, not a control. */
export const KnobPage: Story = {
  args: { label: 'Style', size: 'knob', tip: 'browser.open' },
};

/** Swap mode on the knob page: the same block; the part's hue stays on its lamp and strip. */
export const SwapR1: Story = {
  args: { label: 'Swap R1', size: 'knob' },
};
