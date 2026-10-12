import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../storybook';
import { Readout } from '../../components';
import { DisplayArt } from './DisplayArt';

const meta = {
  title: 'Yahaha/Primitives/DisplayArt',
  component: DisplayArt,
  decorators: [
    withLibraryTheme,
    (Story) => (
      <div style={{ width: 528 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  args: { fade: true },
  argTypes: { fade: { control: 'boolean' } },
} satisfies Meta<typeof DisplayArt>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board's art. */
export const Board: Story = {};

/** The art without the fade from the ground on its left. */
export const Bare: Story = { args: { fade: false } };

/** Behind the display's readouts: the chord and tempo stay the brightest things on it. */
export const UnderReadouts: Story = {
  render: (args) => (
    <div style={{ position: 'relative' }}>
      <DisplayArt {...args} />
      <div className="lib-stack" style={{ position: 'absolute', inset: 0, alignContent: 'center', padding: 'var(--space-6)' }}>
        <Readout value="Cmaj7" />
        <Readout value="120" unit="BPM" small />
      </div>
    </div>
  ),
};
