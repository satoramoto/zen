import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Decorator } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { Display } from './Display';
import {
  displayBoard,
  displayFillToEnding,
  displayLongChord,
  displayLongFingering,
  displayLongStyle,
  displayLooping,
  displayNoParts,
  displayPartOff,
  displayStopped,
  displaySyncStart,
  displayThreeFour,
} from './Display.fixtures';

/**
 * The original's hero regions on a 1440×900 Stage (1392 × 288) and a 1217×752 one; the redesigned
 * Stage's hero column beside the song form at 1440×900 (about 660 × 250); the column a 1217×752
 * Stage has once it isn't zoomed (about 436 × 200); and a short, wide region.
 */
const REGIONS = {
  large: { width: 1392, height: 288 },
  small: { width: 1169, height: 241 },
  column: { width: 660, height: 250 },
  columnSmall: { width: 436, height: 200 },
  short: { width: 1169, height: 200 },
} as const;

/** Draws the story in its Stage region, `parameters.region` (`large` by default). */
const inRegion: Decorator = (Story, { parameters }) => {
  const size = REGIONS[(parameters.region as keyof typeof REGIONS) ?? 'large'];
  return (
    <div style={{ width: size.width, height: size.height, maxWidth: '100%' }}>
      <Story />
    </div>
  );
};

/**
 * The Stage's hero: one hierarchy instead of three competing thirds. The section on the one
 * `--selected` block, the chord and the tempo in neutral ink at the hero size, what's next right
 * under the section; the style header and One Touch on one quiet line above; a thick beat bar
 * below. Tempo's Tap lives here and nowhere else on the Stage.
 */
const meta = {
  title: 'Library/Yahaha/Components/Display',
  component: Display,
  decorators: [inRegion, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: {
    ...displayBoard,
    onPrev: fn(),
    onNext: fn(),
    onBrowse: fn(),
    onOneTouch: fn(),
    onSound: fn(),
    onTempoUp: fn(),
    onTempoDown: fn(),
    onTempo: fn(),
    onTap: fn(),
    onStyleTempo: fn(),
  },
  argTypes: {
    style: { control: 'object' },
    nowPlaying: { control: 'object' },
    parts: { control: 'object' },
    art: { control: 'boolean' },
    density: { control: 'inline-radio', options: ['auto', 'full', 'compact'] },
  },
} satisfies Meta<typeof Display>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: Am7 in Main B, Main C next with the fill after bar 4, 104 BPM on beat 2, One Touch 2. */
export const Board: Story = {};

/** Stopped with the last chord held, Coastal Highway queued, a clean rack: "Stopped", the beat bar at rest. */
export const Stopped: Story = { args: { ...displayStopped } };

/** Sync Start armed, Intro II armed: the band starts on the first chord. */
export const SyncStartArmed: Story = { args: { ...displaySyncStart } };

/** A long chord name: the hero size steps down until it fits its column. */
export const LongChord: Story = { args: { ...displayLongChord } };

/** A long style name: it ends in an ellipsis (the full name in its title), the metre keeps its place. */
export const LongStyleName: Story = { args: { ...displayLongStyle } };

/** A long fingering: the small line wraps to a second line, nothing is cut off. */
export const LongFingering: Story = { args: { ...displayLongFingering } };

/** Right 1 and Right 3 off: their dots hollow, "· off" after the part's name (just "off" in the one-row strip of a narrow hero). */
export const PartOff: Story = { args: { ...displayPartOff } };

/** A waltz in 3/4: three beat segments, on beat 3. */
export const ThreeFour: Story = { args: { ...displayThreeFour } };

/** Main D looping, nothing queued: "bar 2 of 8" in place of what's next. */
export const Looping: Story = { args: { ...displayLooping } };

/** A fill with Ending II waiting. */
export const FillToEnding: Story = { args: { ...displayFillToEnding } };

/** Without parts, as the Stage may draw it (its mixer names the sounds): three readouts. */
export const NoParts: Story = { args: { ...displayNoParts } };

/**
 * The Stage's hero column at 1440×900, 660 × 250: auto is compact there, the readouts at 9% of the
 * width (59px), about 199px tall; below a 900px hero the parts wrap to one row under the readouts
 * (their dots name the parts), about 235px.
 */
export const StageColumn: Story = { parameters: { region: 'column' } };

/**
 * The column a 1217×752 Stage has unzoomed, 436 × 200: the same proportions at 39px, about 176px
 * tall, with tighter gaps and keys. Below a 600px hero the parts drop (the Stage never shows them).
 */
export const StageColumnSmall: Story = { parameters: { region: 'columnSmall' } };

/** The narrow column with the longest section name, "Ending III", and the long fingering: each readout keeps its cell, the fingering ends in an ellipsis. */
export const StageColumnSmallLong: Story = {
  args: { ...displayLongFingering, nowPlaying: { ...displayLongFingering.nowPlaying, playing: 'Ending III' } },
  parameters: { region: 'columnSmall' },
};

/** Compact in a short, wide region (1169 × 200): the readouts stop at 60px, so the hero fits in 200px. */
export const Compact: Story = { args: { density: 'compact' }, parameters: { region: 'short' } };

/** Full in the Stage's column (660 × 250), without parts as the Stage draws it: the roomy chrome, about 237px tall, when the region has the height. */
export const FullInColumn: Story = { args: { ...displayNoParts, density: 'full' }, parameters: { region: 'column' } };

/** The board in a 1217×752 Stage's region: every size scales with the width (auto: compact below 1200px wide). */
export const SmallStage: Story = { parameters: { region: 'small' } };

/** The long chord in the small region. */
export const SmallStageLongChord: Story = { args: { ...displayLongChord }, parameters: { region: 'small' } };

/** With the background art at the right edge, without parts. */
export const WithArt: Story = { args: { ...displayNoParts, art: true } };
