// Pad in the Svelte Storybook: the same story names and args as Pad.stories.tsx, from
// Pad.fixtures.ts. Behaviours (the `play` functions) are exercised on the React stories; the
// parity test holds this renderer to the same DOM. Stories with several pads draw them in a row.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../../svelte/stories/story';
import Pad from './Pad.svelte';
import { padArgTypes, padStories as s } from './Pad.fixtures';

// Each fixture's args already hold the base args, so the meta adds only the spies (a row of pads
// draws each item over these, so a bank's pads stay as written).
const meta: Meta = {
  title: 'Design OS/Components/Music/Pad',
  component: Pad,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onPress: fn(), tipAction: fn() },
  argTypes: padArgTypes,
};
export default meta;

const story = fixtureStory(Pad);

export const Board: FixtureStory = story(s.Board);
export const Idle: FixtureStory = story(s.Idle);
export const Dark: FixtureStory = story(s.Dark);
export const DarkUtility: FixtureStory = story(s.DarkUtility);
export const Next: FixtureStory = story(s.Next);
export const NextCorner: FixtureStory = story(s.NextCorner);
export const TagClearance: FixtureStory = story(s.TagClearance);
export const NextUnlit: FixtureStory = story(s.NextUnlit);
export const Armed: FixtureStory = story(s.Armed);
export const Utility: FixtureStory = story(s.Utility);
export const UtilityOn: FixtureStory = story(s.UtilityOn);
export const Running: FixtureStory = story(s.Running);
export const RoleRunning: FixtureStory = story(s.RoleRunning);
export const RoleStopped: FixtureStory = story(s.RoleStopped);
export const RoleOn: FixtureStory = story(s.RoleOn);
export const RoleArmed: FixtureStory = story(s.RoleArmed);
export const Hue: FixtureStory = story(s.Hue);
export const HueDark: FixtureStory = story(s.HueDark);
export const NextAccent: FixtureStory = story(s.NextAccent);
export const Disabled: FixtureStory = story(s.Disabled);
export const FillCell: FixtureStory = story(s.FillCell);
export const Bank: FixtureStory = story(s.Bank);
export const OnRing: FixtureStory = story(s.OnRing);
export const BankRing: FixtureStory = story(s.BankRing);
