import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { Stage } from './Stage';
import { stageBoard, stageStories as s } from './Stage.fixtures';
import { StagePlayground } from './StagePlayground';

/**
 * The whole app on one screen: the AppBar, the Display (the hero), the transport, the mixer, the
 * knobs over the pads (open on the Sections bank, where the song's sections live), the status line and the keys. Each region takes its data as
 * one object; its callbacks pass straight through.
 */
const meta = {
  title: 'Yahaha/Screens/Stage',
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
  // Scaled by default: the 1920 × 1080 board drawn to fit the canvas. Switch `fit` to `contain` (and set a width and height) to see the forms step down.
  args: { ...stageBoard, fit: 'scale', tipAction: fn() },
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
    fit: { control: 'inline-radio', options: ['scale', 'contain'], table: { category: 'Layout' } },
  },
} satisfies Meta<typeof Stage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The 1920 × 1080 board, scaled to the canvas (16:9, ground bands round it): Am7 in Main B, Main C next
 * after bar 4, running at 104; split F#2 with the left hand's Am7 held. The hero with the
 * transport beside it, then the mixer and the knobs over the pads (on Sections) on the same
 * column seam.
 */
export const Board: Story = { args: s.Board.args };

/** The board with the pads on Quick Racks: the bank's own pads, not the song's sections. */
export const QuickRacks: Story = {
  args: s.QuickRacks.args,
};

/** Stopped on Main A at 92 with Coastal Highway queued, the faders on the Reverb layer, a message on the status line. */
export const Stopped: Story = {
  args: s.Stopped.args,
};

/** A 16:10 laptop, 1440 × 900: the Stage stays 16:9, a 1440 × 810 room with a ground band above and below. */
export const Letterboxed: Story = {
  args: s.Letterboxed.args,
};

/** An ultrawide, 2560 × 1080: the board's 1920 × 1080 room, centred, with a ground band each side. */
export const Pillarboxed: Story = {
  args: s.Pillarboxed.args,
};

/** The smallest screen, 1217 × 752: a 1217 × 684.6 room between ground bands; the solver steps the controls, then the hero, down before it zooms; nothing cut off. */
export const Small: Story = {
  args: s.Small.args,
};

/** 900 × 700: a 900 × 506 room, below the Stage's least: every region at a lean form, the body held at the 24 px target, and it scrolls. */
export const Narrow: Story = {
  args: s.Narrow.args,
};

/** The same 900 × 700 frame scaled: the whole 1920 × 1080 board drawn at 0.469, the forms the board's. */
export const NarrowScaled: Story = {
  args: s.NarrowScaled.args,
};

/** The alternative `split` layout on the board: the hero across the top, the transport down the right beside the pads. */
export const SplitBoard: Story = {
  args: s.SplitBoard.args,
};

/** The `split` layout on the smallest screen, 1217 × 752. */
export const SplitSmall: Story = {
  args: s.SplitSmall.args,
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
    // The Pads region opens on its Sections bank: a section pad queues as next.
    const pads = within(canvas.getByRole('region', { name: 'Pads' }));
    await userEvent.click(pads.getByRole('button', { name: /^Main D \(pad 12\)/ }));
    await expect(pads.getByRole('button', { name: /^Main D, next/ })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /^Metronome settings/ }));
    await expect(canvas.getByRole('dialog', { name: 'Metronome settings' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('dialog', { name: 'Metronome settings' })).toBeNull();
  },
};
