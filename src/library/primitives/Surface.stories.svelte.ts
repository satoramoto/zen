// Surface in the Svelte Storybook: the same story names and args as Surface.stories.tsx, from
// Surface.fixtures.ts, drawn by Surface.story.svelte. Svelte draws no shader material yet.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../storybook-svelte';
import SurfaceStory from './Surface.story.svelte';
import { surfaceArgTypes, surfaceArgs } from './Surface.fixtures';

const meta: Meta = {
  title: 'Design OS/Primitives/Surface',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: surfaceArgs,
  argTypes: surfaceArgTypes,
  render: (args) => ({ Component: SurfaceStory, props: { ...args, story: 'Playground' } }),
};
export default meta;

/** One specimen: every control changes it. */
export const Playground = {};

/** Every layer (rows) wearing every material (columns), with the no-layer row and no-material column. */
export const LayersByMaterials = {
  name: 'Layers × materials',
  render: (args: Record<string, unknown>) => ({ Component: SurfaceStory, props: { ...args, story: 'LayersByMaterials' } }),
};

/** A float and an overlay pane for each shader material over a busy ground: in Svelte, every pane's CSS layer alone. */
export const Shader = {
  render: (args: Record<string, unknown>) => ({ Component: SurfaceStory, props: { ...args, story: 'Shader' } }),
};

/** Keys at rest, pressed, lit in each slot, and bordered. */
export const States = {
  render: (args: Record<string, unknown>) => ({ Component: SurfaceStory, props: { ...args, story: 'States' } }),
};
