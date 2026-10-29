import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FormProvider } from '../../../layout/assembly';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { StemLanes } from './StemLanes';
import StemLanesSvelte from './StemLanes.svelte';
import { stemLanesArgTypes, stemLanesBoard, stemLanesStories as s } from './StemLanes.fixtures';

// Every story is built from StemLanes.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`. The three forms are chosen by the
// form scope (as an assembled screen chooses them), so the stories that pin one stay React.

/**
 * One deck's faceplate: a shared ruler carrying the hot cues as small labelled flags, the loop window
 * as a shaded band and the playhead; then one lane per stem, a hue mark, the name, its peaks as a
 * mirrored envelope and an M / S lamp pair. Controlled: a cue flag calls `onCue(id)`, a lamp calls
 * `onToggle(id)`, and the deck draws only the `muted` / `soloed` flags it is given.
 */
const meta = {
  title: 'Design OS/Components/Music/StemLanes',
  component: StemLanes,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  // The deck fills the width it is given, as a faceplate does; a narrow column is the form's choice.
  parameters: { layout: 'fullscreen' },
  argTypes: stemLanesArgTypes,
} satisfies Meta<typeof StemLanes>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(StemLanes, StemLanesSvelte);

/** The callbacks an operable deck needs: a cue press and a lamp press. */
const wired = { onCue: fn(), onToggle: fn() };

/** The deck on a song: four stems (the bass muted, the vocal soloed), four cues, an eight-bar window, and the playhead just past the drop. */
export const Default: Story = story(s.Default, { args: { ...stemLanesBoard, ...wired } });

/** Every state the deck draws: `four` (the board), `stacked` (thinner, cue flags without labels) and `one` (the selected stem alone, the ruler kept) over one another. */
export const EveryState: Story = story(s.EveryState, {
  args: { ...stemLanesBoard, ...wired },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-4)', width: 900, maxWidth: '100%' }}>
      {(['four', 'stacked', 'one'] as const).map((form) => (
        <FormProvider key={form} form={form}>
          <StemLanes {...args} />
        </FormProvider>
      ))}
    </div>
  ),
});

/** The `stacked` form in a 900 px frame: every lane, thinner, the cue flags as bare markers, so a narrow column still shows the whole deck. */
export const Dense: Story = story(s.Dense, {
  args: { ...stemLanesBoard, ...wired },
  render: (args) => (
    <div style={{ width: 900, maxWidth: '100%' }}>
      <FormProvider form="stacked">
        <StemLanes {...args} />
      </FormProvider>
    </div>
  ),
});

/** No stems and no cues: the ruler and the deck's empty face, so an unloaded deck still reads as a deck. */
export const Empty: Story = story(s.Empty, { args: { stems: [], ...wired } });

/** The board with no callbacks: the cue flags and every lamp are disabled, so the deck is read, not played. */
export const Disabled: Story = story(s.Disabled);
