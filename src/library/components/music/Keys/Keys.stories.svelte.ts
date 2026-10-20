// Keys in the Svelte Storybook: the same story names and args as Keys.stories.tsx, from
// Keys.fixtures.ts. Behaviours (the `play` functions) are exercised on the React stories; the
// parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import Keys from './Keys.svelte';
import { keysArgTypes, keysStories as s } from './Keys.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Music/Keys',
  component: Keys,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { tipAction: fn(), onSplit: fn(), onPick: fn() },
  argTypes: keysArgTypes,
};
export default meta;

const story = fixtureStory(Keys);
/** A picture: no `onSplit`, so no handle (the meta's spy is dropped). */
const picture = (fixture: FixtureStory): FixtureStory => ({ ...fixture, args: { ...fixture.args, onSplit: undefined } });

export const Board: FixtureStory = story(s.Board);
export const Idle: FixtureStory = story(s.Idle);
export const BlackKeySplit: FixtureStory = story(s.BlackKeySplit);
export const Drag: FixtureStory = story(s.Drag);
export const Armed: FixtureStory = story(s.Armed);
export const Locked: FixtureStory = story(s.Locked);
export const NoSplit: FixtureStory = story(s.NoSplit);
export const Keys49: FixtureStory = story(s.Keys49);
export const HighSplit: FixtureStory = story(s.HighSplit);
export const Picture: FixtureStory = picture(story(s.Picture));
export const NoRuler: FixtureStory = picture(story(s.NoRuler));
export const Fluid: FixtureStory = { ...story(s.Fluid), parameters: { layout: 'padded' } } as FixtureStory;
export const Narrow: FixtureStory = story(s.Narrow);
