import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hole, Opaque } from '../primitives/Surface';
import HoleSvelte from '../primitives/Hole.svelte';
import OpaqueSvelte from '../primitives/Opaque.svelte';
import { withLibraryTheme } from '../storybook';
import { fixtureStories, withRenderer } from '../stories/story';
import { Layer } from './Layer';
import LayerSvelte from './Layer.svelte';
import { holeStories, layerArgTypes, layerStories, opaqueStories } from './Layer.fixtures';

// Every story is built from Layer.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React or Svelte (Opaque and Hole, unconverted, the same way).
const meta: Meta = {
  title: 'Design OS/Layout/Layer',
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'centered' },
  argTypes: layerArgTypes,
};
export default meta;
type Story = StoryObj;

const layer = fixtureStories<Story>(Layer, LayerSvelte);
const hidden = { level: { table: { disable: true } } };

/** Every level of the depth stack as a Layer (a `Surface` with a `layer` and card corners). */
export const Levels: Story = layer(layerStories.Levels);

/** A popover's surface: `float`, with its role and name, taking the right of the picture's light. */
export const Popover: Story = layer(layerStories.Popover);

/** Opaque: every layer inside draws its solid fill and no backdrop. */
export const OpaqueScope: Story = { name: 'Opaque', argTypes: hidden, ...fixtureStories<Story>(Opaque, OpaqueSvelte)(opaqueStories.OpaqueScope) };

/** Hole: a cut-out through every layer to what's behind the page; it paints nothing. */
export const HoleCutOut: Story = { name: 'Hole', argTypes: hidden, ...fixtureStories<Story>(Hole, HoleSvelte)(holeStories.HoleCutOut) };
