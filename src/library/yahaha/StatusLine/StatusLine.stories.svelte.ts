// StatusLine in the Svelte Storybook: the same story names and args as StatusLine.stories.tsx, from
// StatusLine.fixtures.ts. Behaviours (the `play` functions) are exercised on the React stories; the
// parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../svelte/stories/story';
import StatusLine from './StatusLine.svelte';
import { statusLineArgTypes, statusLineStories as s } from './StatusLine.fixtures';

const meta: Meta = {
  title: 'Yahaha/Primitives/StatusLine',
  component: StatusLine,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  args: { onClear: fn(), tip: 'display.status' },
  argTypes: statusLineArgTypes,
};
export default meta;

const story = fixtureStory(StatusLine);

export const Board: FixtureStory = story(s.Board);
export const Error: FixtureStory = story(s.Error);
export const Notice: FixtureStory = story(s.Notice);
export const Clears: FixtureStory = story(s.Clears);
export const Hint: FixtureStory = story(s.Hint);
export const HintOverMessage: FixtureStory = story(s.HintOverMessage);
export const LongText: FixtureStory = story(s.LongText);
export const Focused: FixtureStory & { parameters: object } = { ...story(s.Focused), parameters: { pseudo: { focusVisible: true } } };
export const HintNarrow: FixtureStory = story(s.HintNarrow);
