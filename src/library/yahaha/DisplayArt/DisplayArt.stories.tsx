import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../storybook';
import { ChordReadout, TempoReadout } from '../../components/music';
import { DisplayArt } from './DisplayArt';
import { DISPLAY_WIDTH, UNDER_READOUTS, displayArtArgTypes, displayArtStories as s } from './DisplayArt.fixtures';

const meta = {
  title: 'Yahaha/Primitives/DisplayArt',
  component: DisplayArt,
  decorators: [
    withLibraryTheme,
    (Story) => (
      <div style={{ width: DISPLAY_WIDTH }}>
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  args: { fade: true },
  argTypes: displayArtArgTypes,
} satisfies Meta<typeof DisplayArt>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board's art. */
export const Board: Story = { args: s.Board.args };

/** The art without the fade from the ground on its left. */
export const Bare: Story = { args: s.Bare.args };

/** Behind the display's readouts: the chord and tempo stay the brightest things on it. */
export const UnderReadouts: Story = {
  args: s.UnderReadouts.args,
  render: (args) => (
    <div style={{ position: 'relative' }}>
      <DisplayArt {...args} />
      <div className="lib-specimens"style={{ position: 'absolute', inset: 0, alignContent: 'center', padding: 'var(--space-6)' }}>
        <ChordReadout chord={UNDER_READOUTS.chord} extension={UNDER_READOUTS.extension} />
        <TempoReadout bpm={UNDER_READOUTS.bpm} />
      </div>
    </div>
  ),
};
