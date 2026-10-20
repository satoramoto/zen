// Button in the Svelte Storybook: the same story names and args as Button.stories.tsx, from
// Button.fixtures.ts. Behaviours (the `play` functions) are exercised on the React stories; the
// parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import Button from './Button.svelte';
import { buttonArgTypes, buttonStories as s } from './Button.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Core/Button',
  component: Button,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onPress: fn(), onHold: fn(), onLongPress: fn(), onLongRelease: fn(), tipAction: fn() },
  argTypes: buttonArgTypes,
};
export default meta;

const story = fixtureStory(Button);

export const Board: FixtureStory = story(s.Board);
export const Icon: FixtureStory = story(s.Icon);
export const BandOn: FixtureStory = story(s.BandOn);
export const On: FixtureStory = story(s.On);
export const Chosen: FixtureStory = story(s.Chosen);
export const Band: FixtureStory = story(s.Band);
export const Running: FixtureStory = story(s.Running);
export const Stopped: FixtureStory = story(s.Stopped);
export const Waiting: FixtureStory = story(s.Waiting);
export const WaitingFlash: FixtureStory = story(s.WaitingFlash);
export const Role2: FixtureStory = story(s.Role2);
export const Tall: FixtureStory = story(s.Tall);
export const Disabled: FixtureStory = story(s.Disabled);
export const DisabledHue: FixtureStory = story(s.DisabledHue);
export const Hold: FixtureStory = story(s.Hold);
export const LongPress: FixtureStory = story(s.LongPress);
export const Hierarchy: FixtureStory = story(s.Hierarchy);
export const Quiet: FixtureStory = story(s.Quiet);
export const IconToggle: FixtureStory = story(s.IconToggle);
export const Faces: FixtureStory = story(s.Faces);
export const Sizes: FixtureStory = story(s.Sizes);
