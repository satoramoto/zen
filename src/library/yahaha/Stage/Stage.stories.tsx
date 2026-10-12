import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { Stage } from './Stage';
import { stageBoard, stageStopped } from './Stage.fixtures';
import { StagePlayground } from './StagePlayground';

/**
 * The whole app on one screen: the AppBar, the Display (the hero), the song form and transport,
 * the mixer, the knobs over the pads, the status line and the keys. Each region takes its data as
 * one object; its callbacks pass straight through.
 */
const meta = {
  title: 'Library/Yahaha/Screens/Stage',
  component: Stage,
  decorators: [
    (Story) => (
      <div className="yh-stage-frame">
        <Story />
      </div>
    ),
    withLibraryTheme,
  ],
  parameters: { layout: 'fullscreen' },
  args: { ...stageBoard, width: 1440, height: 900, tipAction: fn() },
  argTypes: {
    appBar: { control: 'object', table: { category: 'AppBar' } },
    display: { control: 'object', table: { category: 'Display' } },
    songForm: { control: 'object', table: { category: 'SongForm' } },
    faders: { control: 'object', table: { category: 'FaderBank' } },
    knobs: { control: 'object', table: { category: 'KnobBank' } },
    pads: { control: 'object', table: { category: 'PadBank' } },
    keys: { control: 'object', table: { category: 'Keys' } },
    status: { control: 'object', table: { category: 'StatusLine' } },
    width: { control: { type: 'number', min: 0, step: 1 }, table: { category: 'Layout' } },
    height: { control: { type: 'number', min: 0, step: 1 }, table: { category: 'Layout' } },
    layout: { control: 'inline-radio', options: ['stacked', 'split'], table: { category: 'Layout' } },
  },
} satisfies Meta<typeof Stage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The board at 1440 × 900: Am7 in Main B, Main C next after bar 4, running at 104; split F#2 with
 * the left hand's Am7 held. The hero with the transport beside it, the song form one strip under
 * them, then the mixer and the knobs over the pads on the same column seam.
 */
export const Board: Story = {};

/** Stopped on Main A at 92 with Coastal Highway queued, the faders on the Reverb layer, a message on the status line. */
export const Stopped: Story = {
  args: { ...stageStopped },
};

/** The smallest screen, 1217 × 752: laid out at 100%, the hero compact, nothing cut off. */
export const Small: Story = {
  args: { width: 1217, height: 752 },
};

/** The alternative `split` layout on the board: the hero, and beside it the song form over the transport. */
export const SplitBoard: Story = {
  args: { layout: 'split' },
};

/** The `split` layout on the smallest screen, 1217 × 752. */
export const SplitSmall: Story = {
  args: { layout: 'split', width: 1217, height: 752 },
};

/**
 * Play with the screen: a story-only wrapper (`StagePlayground`) keeps what you change. Pages,
 * layers, fader pages, knob pages and pad banks choose; sections queue as next and land at the end
 * of the phrase (or on a second press); Start / Stop runs the band and the beat moves; − + and
 * Tap change the tempo; faders move; the metronome's ▾ opens and closes its popover; One Touch
 * applies, from the hero or the OTS pads. It fills the window, so resize the window to see the
 * fit. Every press logs in the Actions panel.
 */
export const Playground: Story = {
  args: { tipAction: undefined, width: undefined, height: undefined },
  render: (args) => <StagePlayground {...args} log={fn().mockName('stage')} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = within(canvas.getByRole('group', { name: 'Sections' }));
    await userEvent.click(form.getByRole('button', { name: 'Main D' }));
    await expect(form.getByRole('button', { name: /^Main D, next/ })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /^Metronome settings/ }));
    await expect(canvas.getByRole('dialog', { name: 'Metronome settings' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('dialog', { name: 'Metronome settings' })).toBeNull();
  },
};
