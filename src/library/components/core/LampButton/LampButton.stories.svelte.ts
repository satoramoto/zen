// LampButton in the Svelte Storybook: the same story names and args as LampButton.stories.tsx, from
// LampButton.fixtures.ts. Behaviours (the `play` functions) are exercised on the React stories; the
// parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import LampButton from './LampButton.svelte';
import { lampButtonArgTypes, lampButtonStories as s } from './LampButton.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Core/LampButton',
  component: LampButton,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { label: 'Accomp', onToggle: fn(), onLongPress: fn(), onLongRelease: fn(), tipAction: fn() },
  argTypes: lampButtonArgTypes,
};
export default meta;

const story = fixtureStory(LampButton);

export const Board: FixtureStory = story(s.Board);
export const On: FixtureStory = story(s.On);
export const Toggles: FixtureStory = story(s.Toggles);
export const Disabled: FixtureStory = story(s.Disabled);
export const Off: FixtureStory = story(s.Off);
export const HueOn: FixtureStory = story(s.HueOn);
export const HueOn2: FixtureStory = story(s.HueOn2);
export const HueOff: FixtureStory = story(s.HueOff);
export const HueOn4: FixtureStory = story(s.HueOn4);
export const HueDisabled: FixtureStory = story(s.HueDisabled);
export const FunctionOff: FixtureStory = story(s.FunctionOff);
export const FunctionOn: FixtureStory = story(s.FunctionOn);
export const Running: FixtureStory = story(s.Running);
export const Role2On: FixtureStory = story(s.Role2On);
export const Role2Off: FixtureStory = story(s.Role2Off);
export const Role2Waiting: FixtureStory = story(s.Role2Waiting);
export const Recording: FixtureStory = story(s.Recording);
export const Looping: FixtureStory = story(s.Looping);
export const ArmedLoop: FixtureStory = story(s.ArmedLoop);
export const Armed: FixtureStory = story(s.Armed);
export const ArmedPressed: FixtureStory = story(s.ArmedPressed);
export const MinWidth: FixtureStory = story(s.MinWidth);
export const JoinStart: FixtureStory = story(s.JoinStart);
export const AllFaces: FixtureStory = story(s.AllFaces);
