// PadBank in the Svelte Storybook: the Pads region (PadBankRegion.svelte), the same story names
// and args as PadBank.stories.tsx, from PadBank.fixtures.ts, each in the same frame
// (PadBank.story.svelte). Behaviours (the `play` functions) are exercised on the React stories;
// the parity test holds the bank to the same DOM.
import type { Meta } from '@storybook/svelte-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook-svelte';
import PadBankRegion from './PadBankRegion.svelte';
import PadBankStory from './PadBank.story.svelte';
import { padBankArgTypes, padBankBoxes, padBankFrameWidths, padBankStories as s } from './PadBank.fixtures';

const meta: Meta = {
  title: 'Yahaha/Components/PadBank',
  component: PadBankRegion,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { tipAction: fn(), onBank: fn(), onPress: fn() },
  argTypes: padBankArgTypes,
};
export default meta;

type Name = keyof typeof s;

/** A story: its fixture's args, drawn by the story component in its frame and box. */
const story = (name: Name, extra: Record<string, unknown> = {}) => ({
  args: s[name].args as Record<string, unknown> | undefined,
  render: (args: Record<string, unknown>) => ({
    Component: PadBankStory,
    props: { ...args, frameWidth: padBankFrameWidths[name], box: padBankBoxes[name], items: s[name].items, ...extra },
  }),
});

export const Board = story('Board');
export const Sections = story('Sections');
export const FourByFour = story('FourByFour');
export const FlashOff = story('FlashOff');
export const StoreArmed = story('StoreArmed');
export const ChordBank = story('ChordBank');
export const FewerPads = story('FewerPads');
export const FewerPadsFourByFour = story('FewerPadsFourByFour');
export const MultiPadsBank = story('MultiPadsBank');
export const SetupBank = story('SetupBank');
export const PartLit = story('PartLit');
export const At1440 = story('At1440');
export const At1217 = story('At1217');
export const ShortRegion = story('ShortRegion');
export const Forms = story('Forms');
export const Playground = story('Playground', { playground: true });
