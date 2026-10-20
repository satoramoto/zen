// Separator's stories as plain props: Separator.stories.tsx (React) and Separator.stories.svelte.ts
// (Svelte) both draw them, and the parity test renders every instance in both.
import { defineFixtures } from '../../../fixtures';
import type { SeparatorModelProps } from './Separator.model';

/** The controls, the same in both Storybooks. */
export const separatorArgTypes = {
  length: { control: 'inline-radio', options: ['short', 'full'] },
} as const;

/** The InAppBar story's row: tab labels, `|` where a Separator splits the groups, the chosen tab. */
export const APP_BAR = ['Stage', 'Harm/Arp', '|', 'Library', 'Mixer', '|', 'Settings'];
export const APP_BAR_CHOSEN = 'Harm/Arp';

export const separatorStories = defineFixtures<SeparatorModelProps>()({
  Board: { args: { length: 'short' } },
  Full: { args: { length: 'full' } },
  // Each separator on the bar is a bare `<Separator />`.
  InAppBar: { args: {} },
});
