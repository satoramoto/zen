// FaderBank in the Svelte Storybook: the same story names and args as FaderBank.stories.tsx, from
// FaderBank.fixtures.ts, drawn as the mixer's region in the same boxes (FaderBank.story.svelte).
// Behaviours (the `play` functions) are exercised on the React stories; the parity test holds this
// renderer to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import type { Component } from 'svelte';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import FaderBankRegion from './FaderBankRegion.svelte';
import FaderBankStory from './FaderBank.story.svelte';
import { SMALL_REGION, faderBankArgTypes, faderBankStories as s } from './FaderBank.fixtures';

const meta: Meta = {
  title: 'Yahaha/Components/FaderBank',
  component: FaderBankRegion,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    tipAction: fn(),
    onChoosePage: fn(),
    onChooseLayer: fn(),
    onLevel: fn(),
    onOpen: fn(),
    onLamp: fn(),
    onLampLong: fn(),
    onLampRelease: fn(),
    onPageButton: fn(),
    onPageLong: fn(),
    onPageRelease: fn(),
  },
  argTypes: faderBankArgTypes,
};
export default meta;

/** A story: the fixture's args, drawn by the story component with `extra` (its box, forms or live). */
const story = (fixture: { args?: object }, extra: Record<string, unknown> = {}) => ({
  args: fixture.args as Record<string, unknown> | undefined,
  render: (args: Record<string, unknown>) => ({ Component: FaderBankStory as Component<any>, props: { ...args, ...extra } }),
});

export const Board = story(s.Board);
export const PageButtonHold = story(s.PageButtonHold);
export const ReverbLayer = story(s.ReverbLayer);
export const SmallStage = story(s.SmallStage, { region: SMALL_REGION });
export const Forms = story(s.Forms, { forms: true });
export const StylePage = story(s.StylePage);
export const TakeoverBothWays = story(s.TakeoverBothWays);
export const AllPartsOff = story(s.AllPartsOff);
export const Live = story(s.Live, { live: true });
