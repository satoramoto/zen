// Layer (and Opaque and Hole) in the Svelte Storybook: the same story names and args as
// Layer.stories.tsx, from Layer.fixtures.ts.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../storybook-svelte';
import { fixtureStory, type FixtureStory } from '../svelte/stories/story';
import Hole from '../primitives/Hole.svelte';
import Opaque from '../primitives/Opaque.svelte';
import Layer from './Layer.svelte';
import { holeStories, layerArgTypes, layerStories, opaqueStories } from './Layer.fixtures';

const meta: Meta = {
  title: 'Design OS/Layout/Layer',
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  argTypes: layerArgTypes,
};
export default meta;

const layer = fixtureStory(Layer);
const hidden = { level: { table: { disable: true } } };

/** Every level of the depth stack as a Layer (a `Surface` with a `layer` and card corners). */
export const Levels: FixtureStory = layer(layerStories.Levels);

/** A popover's surface: `float`, with its role and name, taking the right of the picture's light. */
export const Popover: FixtureStory = layer(layerStories.Popover);

/** Opaque: every layer inside draws its solid fill and no backdrop. */
export const OpaqueScope = { name: 'Opaque', argTypes: hidden, ...fixtureStory(Opaque)(opaqueStories.OpaqueScope) };

/** Hole: a cut-out through every layer to what's behind the page; it paints nothing. */
export const HoleCutOut = { name: 'Hole', argTypes: hidden, ...fixtureStory(Hole)(holeStories.HoleCutOut) };
