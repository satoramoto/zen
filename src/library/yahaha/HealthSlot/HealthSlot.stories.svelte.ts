// HealthSlot in the Svelte Storybook: the same story names and args as HealthSlot.stories.tsx, from
// HealthSlot.fixtures.ts. Behaviours (the `play` functions) are exercised on the React stories; the
// parity test holds this renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../../svelte/stories/story';
import HealthSlot from './HealthSlot.svelte';
import { healthSlotArgTypes, healthSlotArgs, healthSlotStories as s } from './HealthSlot.fixtures';

const meta: Meta = {
  title: 'Yahaha/Primitives/HealthSlot',
  component: HealthSlot,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onOpen: fn(), ...healthSlotArgs },
  argTypes: healthSlotArgTypes,
};
export default meta;

const story = fixtureStory(HealthSlot);

export const Board: FixtureStory = story(s.Board);
export const Cpu: FixtureStory = story(s.Cpu);
export const Failed: FixtureStory = story(s.Failed);
export const FailedBeatsOff: FixtureStory = story(s.FailedBeatsOff);
export const AudioOff: FixtureStory = story(s.AudioOff);
export const Dropouts: FixtureStory = story(s.Dropouts);
export const OneDropout: FixtureStory = story(s.OneDropout);
export const BufferHint: FixtureStory = story(s.BufferHint);
export const BufferHintInBar: FixtureStory = story(s.BufferHintInBar);
export const LargestBuffer: FixtureStory = story(s.LargestBuffer);
export const AllStates: FixtureStory = story(s.AllStates);
