// AppBar in the Svelte Storybook: the same story names and args as AppBar.stories.tsx, from
// AppBar.fixtures.ts; Live draws AppBar.story.svelte, which holds the bar's state. Behaviours (the
// `play` functions) are exercised on the React stories; the parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../svelte/stories/story';
import AppBar from './AppBar.svelte';
import AppBarStory from './AppBar.story.svelte';
import { appBarArgTypes, appBarStories as s, boardAppBar } from './AppBar.fixtures';

const meta: Meta = {
  title: 'Yahaha/Components/AppBar',
  component: AppBar,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: {
    ...boardAppBar,
    onChoose: fn(),
    onHealth: fn(),
    onMetronome: fn(),
    onMetronomeSettings: fn(),
    onMetronomeClose: fn(),
    onMetronomeVolume: fn(),
    onMetronomeBell: fn(),
    onUnison: fn(),
    onHelp: fn(),
    onPanic: fn(),
    tipAction: fn(),
  },
  argTypes: appBarArgTypes,
};
export default meta;

const story = fixtureStory(AppBar);

export const Board: FixtureStory = story(s.Board);
export const Library: FixtureStory = story(s.Library);
export const OffStage: FixtureStory = story(s.OffStage);
export const NoLaunchkey: FixtureStory = story(s.NoLaunchkey);
export const Trouble: FixtureStory = story(s.Trouble);
export const Helpers: FixtureStory = story(s.Helpers);
export const AllOn: FixtureStory = story(s.AllOn);
export const MetronomeNotAudible: FixtureStory = story(s.MetronomeNotAudible);
export const Narrow: FixtureStory = story(s.Narrow);
export const Wide: FixtureStory = story(s.Wide);
export const Live: FixtureStory = {
  args: s.Live.args as Record<string, unknown>,
  render: (args) => ({ Component: AppBarStory, props: args }),
};
