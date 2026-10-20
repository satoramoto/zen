// MetronomePopover in the Svelte Storybook: the same story names and args as
// MetronomePopover.stories.tsx, from AppBar.fixtures.ts. Behaviours (the `play` functions) are
// exercised on the React stories; the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../svelte/stories/story';
import MetronomePopover from './MetronomePopover.svelte';
import { boardMetronome, metronomePopoverArgTypes, metronomePopoverStories as s } from './AppBar.fixtures';

const meta: Meta = {
  title: 'Yahaha/Components/MetronomePopover',
  component: MetronomePopover,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { ...boardMetronome, tipAction: fn(), onOn: fn(), onVolume: fn(), onBell: fn(), onClose: fn() },
  argTypes: metronomePopoverArgTypes,
};
export default meta;

const story = fixtureStory(MetronomePopover);

export const Board: FixtureStory = story(s.Board);
export const Off: FixtureStory = story(s.Off);
export const NotAudible: FixtureStory = story(s.NotAudible);
