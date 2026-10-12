import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { SongForm } from './SongForm';
import {
  songFormBoard,
  songFormFillPending,
  songFormSparse,
  songFormStopped,
  songFormSyncArmed,
} from './SongForm.fixtures';

/** The region's width on the Stage; `width` in a story's parameters sets it. */
const atWidth: Decorator = (Story, context) => {
  const width = (context.parameters.regionWidth as number | undefined) ?? 1392;
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <Story />
    </div>
  );
};

/**
 * The Stage's song form and transport, one region. It replaces three places in the original:
 * PadBank's Sections bank (Yahaha baseline / Components / PadBank › Board), SectionRow's transport
 * (Components / SectionRow) and TransportColumn (Components / TransportColumn). Default width
 * 1392, the 1440 × 900 board inside its padding; see `At1217` and `Narrow` for smaller Stages.
 */
const meta = {
  title: 'Library/Yahaha/Components/SongForm',
  component: SongForm,
  decorators: [atWidth, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    ...songFormBoard,
    lit: true,
    tipAction: fn(),
    onSection: fn(),
    onStartStop: fn(),
    onStopWithFade: fn(),
    onAccomp: fn(),
    onSyncStart: fn(),
    onSyncStop: fn(),
    onAutoFill: fn(),
    onFillUp: fn(),
    onFillDown: fn(),
    onFade: fn(),
    onReset: fn(),
  },
  argTypes: {
    running: { control: 'boolean' },
    fillPending: { control: 'inline-radio', options: [undefined, 'up', 'down'] },
    lit: { control: 'boolean' },
    nextAt: { control: 'text' },
  },
} satisfies Meta<typeof SongForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stopped (SectionRow's board): Main A chosen to start, Start on the `--transport` fill, Accomp lit; sync and fill keys outlined in the transport hue. */
export const Stopped: Story = {
  args: { ...songFormStopped, next: undefined, nextAt: undefined },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const start = canvas.getByRole('button', { name: 'Start / Stop, stopped' });
    await expect(start).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByRole('button', { name: 'Main A, starts here' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(start);
    await expect(args.onStartStop).toHaveBeenCalledTimes(1);
  },
};

/** Running in Main B with Main C next after bar 4 (PadBank's board). A press on a section queues it. */
export const Board: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Main B, playing' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Main C, next, after bar 4' })).toBeInTheDocument();
    await expect(canvas.getByText('NEXT')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Ending I' }));
    await expect(args.onSection).toHaveBeenCalledWith('ending1');
  },
};

/** The flash's off phase: Main C keeps its NEXT tag; its accent wash goes. */
export const FlashOff: Story = { args: { lit: false } };

/** Fill ▲ queued: the key waits, and the cue reads "Fill, then Main C · after bar 4". */
export const FillPending: Story = {
  args: songFormFillPending,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Fill, then Main C')).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Fill Up: a fill, then the next Main up, queued' }),
    ).toHaveAttribute('data-face', 'waiting');
  },
};

/** Sync Start armed on Intro I: its key waits, and the cue says the band starts with the first chord. */
export const SyncStartArmed: Story = {
  args: { ...songFormSyncArmed, next: undefined, nextAt: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Sync Start, armed' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText('Starts with the first chord')).toBeInTheDocument();
  },
};

/** A style missing sections: one Intro, two Mains, one Ending, no Break; Auto Fill on. Absent steps keep their place. */
export const MissingSections: Story = {
  args: songFormSparse,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Main D, not in this style' }));
    await expect(args.onSection).not.toHaveBeenCalled();
    await expect(canvas.getByRole('button', { name: 'Auto Fill' })).toHaveAttribute('aria-pressed', 'true');
  },
};

/** A fade-out under way while running. */
export const Fading: Story = { args: { fading: true } };

/** The 1217 × 752 Stage: the region 1169 wide, under 37.5 control heights, so the transport sits under the form. */
export const At1217: Story = { parameters: { regionWidth: 1169 } };

/** A narrow column (720): the transport under the form, in two rows sharing its width. */
export const Narrow: Story = { parameters: { regionWidth: 720 } };
