// Separator in the Svelte Storybook: the same story names and args as Separator.stories.tsx, from
// Separator.fixtures.ts, drawn by Separator.story.svelte. The parity test holds this renderer to
// the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../../../storybook-svelte';
import Separator from './Separator.svelte';
import SeparatorStory from './Separator.story.svelte';
import { separatorArgTypes, separatorStories as s } from './Separator.fixtures';

const meta: Meta = {
  title: 'Design OS/Components/Core/Separator',
  component: Separator,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: separatorArgTypes,
};
export default meta;

const drawn = (story: 'Board' | 'Full' | 'InAppBar') => ({
  args: s[story].args,
  render: (args: Record<string, unknown>) => ({ Component: SeparatorStory, props: { ...args, story } }),
});

/** The app bar's hairline between Harm/Arp and Library: a short line, as tall as the tab labels. */
export const Board = drawn('Board');

/** The line spanning the whole row. */
export const Full = drawn('Full');

/** In place on an app bar: two tab runs and the right area, split by short lines. */
export const InAppBar = drawn('InAppBar');
